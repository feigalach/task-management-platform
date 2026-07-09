import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './User';

/**
 * Generic Task entity.
 *
 * There is NO "finalStatus" column here. The final status is a property
 * of the task TYPE (see handlers/*), not of an individual task instance,
 * so it is derived at runtime via HandlerFactory instead of being stored
 * redundantly on every row.
 *
 * "customFields" is a single JSONB column that holds whatever
 * type-specific data a given task type needs (quotes/receipt for
 * procurement, specification/branch/version for development, etc).
 * Adding a new task type never requires a schema migration.
 */
@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 50 })
  type!: string;

  @Column({ type: 'int', default: 1 })
  status!: number;

  @Column({ type: 'boolean', default: false })
  isClosed!: boolean;

  @Column({ type: 'uuid', name: 'assigned_user_id' })
  assignedUserId!: string;

  @ManyToOne(() => User, (user) => user.tasks, { eager: false })
  @JoinColumn({ name: 'assigned_user_id' })
  assignedUser?: User;

  // Who originally created the task - stays fixed even as assignedUserId
  // moves between users through status changes.
  @Column({ type: 'uuid', name: 'created_by_user_id' })
  createdByUserId!: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'created_by_user_id' })
  createdByUser?: User;

  @Column({ type: 'jsonb', default: {} })
  customFields!: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
