import { NextFunction, Request, Response } from 'express';
import { changeStatusSchema, createTaskSchema } from '../dto/task.dto';
import { taskListQuerySchema } from '../dto/pagination.dto';
import { HandlerFactory } from '../handlers/HandlerFactory';
import { TaskService } from '../services/TaskService';

const taskService = new TaskService();

export class TaskController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = createTaskSchema.parse(req.body);
      const task = await taskService.createTask(dto.type, dto.assignedUserId, dto.createdByUserId);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.getTask(req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }

  async changeStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = changeStatusSchema.parse(req.body);
      const task = await taskService.changeStatus(req.params.id, dto.newStatus, dto.assignedUserId, dto.data);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const task = await taskService.closeTask(req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  }

  async getUserTasks(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, pageSize, status, viewBy, types } = taskListQuerySchema.parse(req.query);
      const { tasks, total } = await taskService.getUserTasks(req.params.userId, page, pageSize, viewBy, status, types);
      res.json({ tasks, total, page, pageSize });
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const history = await taskService.getTaskHistory(req.params.id);
      res.json(history);
    } catch (err) {
      next(err);
    }
  }

  /** Exposes each registered handler's status list + final status so the
   *  client can render dynamic forms without hard-coding task types. */
  async getTaskTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const types = HandlerFactory.getAll().map((handler) => ({
        type: handler.type,
        statuses: handler.getStatuses(),
        finalStatus: handler.getFinalStatusNumber(),
      }));
      res.json(types);
    } catch (err) {
      next(err);
    }
  }
}
