/**
 * Contract that every task-type "handler" (Strategy) must implement.
 * The generic TaskService only ever talks to this interface — it never
 * knows whether it is dealing with Procurement, Development, or any
 * future type.
 */

export type FieldType = 'string' | 'string[]' | 'number';

export interface StatusFieldRequirement {
  key: string;
  label: string;
  type: FieldType;
  /** For 'string[]' fields: minimum number of items required (e.g. 2 quotes) */
  minItems?: number;
  /** For 'string[]' fields: maximum number of items allowed */
  maxItems?: number;
}

export interface StatusDefinition {
  number: number;
  name: string;
  /** Data that must be supplied when a task ENTERS this status */
  requiredFields: StatusFieldRequirement[];
}

export interface ITaskTypeHandler {
  readonly type: string;

  /** Ordered list of statuses that make up this task type's lifecycle */
  getStatuses(): StatusDefinition[];

  getStatusDefinition(statusNumber: number): StatusDefinition | undefined;

  isValidStatusNumber(statusNumber: number): boolean;

  /** The last status in the lifecycle — only from here can a task be closed.
   *  Derived from getStatuses(), never stored on the Task row. */
  getFinalStatusNumber(): number;

  getInitialStatusNumber(): number;

  /** Throws AppError(400, ...) if `data` does not satisfy the requirements
   *  of the given target status. */
  validateCustomFields(statusNumber: number, data: Record<string, any>): void;
}
