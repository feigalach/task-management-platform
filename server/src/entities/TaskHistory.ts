import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Task } from './Task';

export type TaskHistoryAction = 'created' | 'status_change' | 'closed';

/**
 * Append-only audit trail. One row per lifecycle event on a task:
 * - 'created'        : fromStatus/fromUserId are null, toStatus/toUserId
 *                       are the task's initial status and owner.
 * - 'status_change'   : a forward or backward move, with whoever the task
 *                       was reassigned from and to.
 * - 'closed'          : fromStatus === toStatus (closing doesn't change
 *                       status), fromUserId === toUserId (closing doesn't
 *                       reassign) - recorded purely so "when/who closed
 *                       this" is answerable later.
 *
 * This is generic across task types on purpose: it only ever records
 * status numbers and user ids, never anything type-specific, so it needs
 * no changes when a new task type is added.
 */
@Entity('task_history')
export class TaskHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'task_id' })
  taskId!: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'task_id' })
  task?: Task;

  @Column({ type: 'varchar', length: 20 })
  action!: TaskHistoryAction;

  @Column({ type: 'int', name: 'from_status', nullable: true })
  fromStatus!: number | null;

  @Column({ type: 'int', name: 'to_status' })
  toStatus!: number;

  @Column({ type: 'uuid', name: 'from_user_id', nullable: true })
  fromUserId!: string | null;

  @Column({ type: 'uuid', name: 'to_user_id' })
  toUserId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
