export interface User {
  id: string;
  name: string;
}

export type FieldType = 'string' | 'string[]' | 'number';

export interface StatusFieldRequirement {
  key: string;
  label: string;
  type: FieldType;
  minItems?: number;
  maxItems?: number;
}

export interface StatusDefinition {
  number: number;
  name: string;
  requiredFields: StatusFieldRequirement[];
}

export interface TaskTypeDescriptor {
  type: string;
  statuses: StatusDefinition[];
  finalStatus: number;
}

export interface Task {
  id: string;
  type: string;
  status: number;
  isClosed: boolean;
  assignedUserId: string;
  createdByUserId: string;
  customFields: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedTasks {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
}

export type TaskHistoryAction = 'created' | 'status_change' | 'closed';

export interface TaskHistoryEntry {
  id: string;
  taskId: string;
  action: TaskHistoryAction;
  fromStatus: number | null;
  toStatus: number;
  fromUserId: string | null;
  toUserId: string;
  createdAt: string;
}
