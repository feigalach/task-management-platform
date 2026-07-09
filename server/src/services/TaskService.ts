import { In } from 'typeorm';
import { AppDataSource } from '../config/data-source';
import { Task } from '../entities/Task';
import { TaskHistory } from '../entities/TaskHistory';
import { User } from '../entities/User';
import { AppError } from '../errors/AppError';
import { HandlerFactory } from '../handlers/HandlerFactory';
import { logger } from '../utils/logger';

const taskRepo = () => AppDataSource.getRepository(Task);
const userRepo = () => AppDataSource.getRepository(User);
const historyRepo = () => AppDataSource.getRepository(TaskHistory);

/**
 * Generic workflow engine.
 *
 * This class implements the CORE WORKFLOW RULES (section 2 of the spec)
 * exactly once, for every task type, present and future. It never branches
 * on `task.type` — it delegates anything type-specific to the
 * ITaskTypeHandler obtained from HandlerFactory.
 *
 * Every state-changing method also writes one TaskHistory row, inside the
 * same DB transaction as the task update, so the task's current state and
 * its audit trail can never drift apart even if the process crashes
 * mid-write.
 */
export class TaskService {
  async createTask(type: string, assignedUserId: string, createdByUserId: string): Promise<Task> {
    logger.info('Creating task', { type, assignedUserId, createdByUserId });

    const handler = HandlerFactory.get(type); // throws AppError(400) if unknown type

    const assignee = await userRepo().findOneBy({ id: assignedUserId });
    if (!assignee) throw new AppError(404, `User ${assignedUserId} not found`);

    const creator = await userRepo().findOneBy({ id: createdByUserId });
    if (!creator) {
      throw new AppError(404, `User ${createdByUserId} not found`);
    }

    const initialStatus = handler.getInitialStatusNumber();

    const saved = await AppDataSource.transaction(async (manager) => {
      const task = manager.create(Task, {
        type,
        status: initialStatus,
        isClosed: false,
        assignedUserId,
        createdByUserId,
        customFields: {},
      });
      const savedTask = await manager.save(task);

      await manager.save(
        manager.create(TaskHistory, {
          taskId: savedTask.id,
          action: 'created',
          fromStatus: null,
          toStatus: initialStatus,
          fromUserId: null,
          toUserId: assignedUserId,
        })
      );

      return savedTask;
    });

    logger.info('Task created', { taskId: saved.id, type, status: initialStatus, assignedUserId });
    return saved;
  }

  async getTask(id: string): Promise<Task> {
    const task = await taskRepo().findOneBy({ id });
    if (!task) {
      throw new AppError(404, `Task ${id} not found`);
    }
    return task;
  }

  async getUserTasks(
    userId: string,
    page: number,
    pageSize: number,
    viewBy: 'assigned' | 'created',
    status: 'all' | 'open' | 'closed',
    types: string[] | undefined
  ): Promise<{ tasks: Task[]; total: number }> {
    const user = await userRepo().findOneBy({ id: userId });
    if (!user) {
      throw new AppError(404, `User ${userId} not found`);
    }

    // viewBy picks which column userId is matched against - tasks I
    // currently own vs. tasks I originally opened (which may have moved
    // to someone else since). Status and type are independent filters
    // applied on top of whichever base column is selected.
    const where: Record<string, any> = viewBy === 'created' ? { createdByUserId: userId } : { assignedUserId: userId };
    if (status === 'open') { where.isClosed = false };
    if (status === 'closed') { where.isClosed = true; }
    if (types && types.length > 0) { where.type = In(types); }

    // Real DB-level pagination (skip/take), not "fetch everything and
    // slice in memory" - so a user with thousands of tasks is just as
    // fast to query as one with a handful, regardless of which filters
    // are active. Ordered by updatedAt: any status change bumps the task
    // back to the top of its group.
    const [tasks, total] = await taskRepo().findAndCount({
      where,
      order: { updatedAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { tasks, total };
  }

  async getTaskHistory(taskId: string): Promise<TaskHistory[]> {
    await this.getTask(taskId); // 404s if the task doesn't exist
    return historyRepo().find({ where: { taskId }, order: { createdAt: 'ASC' } });
  }

  /**
   * closed tasks are immutable.
   * Rule 3/4: statuses are ascending ints; forward moves must be +1 exactly.
   * Rule 5: backward moves are always allowed.
   * Rule 7: every change validates type-specific data and records the next
   *         assigned user, in a single save (no duplicate writes).
   */
  async changeStatus(
    taskId: string,
    newStatus: number,
    nextAssignedUserId: string,
    data: Record<string, any>
  ): Promise<Task> {
    logger.info('Changing task status', { taskId, newStatus, nextAssignedUserId });

    const task = await this.getTask(taskId);

    if (task.isClosed) {
      throw new AppError(409, 'Cannot change the status of a closed task');
    }

    const handler = HandlerFactory.get(task.type);

    if (!handler.isValidStatusNumber(newStatus)) {
      throw new AppError(400, `Status ${newStatus} does not exist for task type "${task.type}"`);
    }

    if (newStatus > task.status && newStatus !== task.status + 1) {
      throw new AppError(
        409,
        `Forward moves must be sequential. Current status is ${task.status}, cannot jump to ${newStatus}`
      );
    }
    // newStatus < task.status -> backward move, always allowed (rule 5)
    // newStatus === task.status -> no-op status-wise, still allowed to just
    //   update data/assignee if the caller wants; treated like any move.

    const nextUser = await userRepo().findOneBy({ id: nextAssignedUserId });
    if (!nextUser) {
      throw new AppError(404, `User ${nextAssignedUserId} not found`);
    }

    // Rule 7a: type-specific data requirements for the *target* status
    handler.validateCustomFields(newStatus, data);

    const previousStatus = task.status;
    const previousUserId = task.assignedUserId;

    task.status = newStatus;
    task.assignedUserId = nextAssignedUserId; // Rule 7b
    task.customFields = { ...task.customFields, ...data }; // merge, single save, no duplicate storage

    const saved = await AppDataSource.transaction(async (manager) => {
      const savedTask = await manager.save(task);

      await manager.save(
        manager.create(TaskHistory, {
          taskId: savedTask.id,
          action: 'status_change',
          fromStatus: previousStatus,
          toStatus: newStatus,
          fromUserId: previousUserId,
          toUserId: nextAssignedUserId,
        })
      );

      return savedTask;
    });

    logger.info('Task status changed', {
      taskId,
      from: previousStatus,
      to: newStatus,
      fromUser: previousUserId,
      toUser: nextAssignedUserId,
    });
    return saved;
  }

  /**
   * Rule 6: a task may be closed only at its final status.
   * The final status is NOT stored on the task — it is derived from the
   * handler for the task's type at validation time.
   */
  async closeTask(taskId: string): Promise<Task> {
    logger.info('Closing task', { taskId });

    const task = await this.getTask(taskId);

    if (task.isClosed) {
      throw new AppError(409, 'Task is already closed');
    }

    const handler = HandlerFactory.get(task.type);
    const finalStatus = handler.getFinalStatusNumber();

    if (task.status !== finalStatus) {
      throw new AppError(
        409,
        `Task can only be closed from its final status (${finalStatus}). Current status: ${task.status}`
      );
    }

    task.isClosed = true;

    const saved = await AppDataSource.transaction(async (manager) => {
      const savedTask = await manager.save(task);

      await manager.save(
        manager.create(TaskHistory, {
          taskId: savedTask.id,
          action: 'closed',
          fromStatus: savedTask.status,
          toStatus: savedTask.status,
          fromUserId: savedTask.assignedUserId,
          toUserId: savedTask.assignedUserId,
        })
      );

      return savedTask;
    });

    logger.info('Task closed', { taskId, status: saved.status, owner: saved.assignedUserId });
    return saved;
  }
}
