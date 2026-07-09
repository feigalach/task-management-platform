import { PaginatedTasks, Task, TaskHistoryEntry, TaskTypeDescriptor } from '../types';
import { apiClient } from './client';

export type ViewBy = 'assigned' | 'created';

export interface UserTasksFilters {
  status: 'all' | 'open' | 'closed';
  viewBy: ViewBy;
  /** undefined/empty = no type filter (all types) */
  types?: string[];
}

export const taskApi = {
  getTaskTypes: async (): Promise<TaskTypeDescriptor[]> => {
    const { data } = await apiClient.get('/task-types');
    return data;
  },

  create: async (type: string, assignedUserId: string, createdByUserId: string): Promise<Task> => {
    const { data } = await apiClient.post('/tasks', { type, assignedUserId, createdByUserId });
    return data;
  },

  getOne: async (id: string): Promise<Task> => {
    const { data } = await apiClient.get(`/tasks/${id}`);
    return data;
  },

  getHistory: async (id: string): Promise<TaskHistoryEntry[]> => {
    const { data } = await apiClient.get(`/tasks/${id}/history`);
    return data;
  },

  /**
   * Real server-side pagination + filtering (status/viewBy/type all
   * become SQL WHERE clauses + skip/take on the server) - so this stays
   * fast for a user with thousands of tasks, not just a handful.
   */
  getUserTasks: async (
    userId: string,
    page: number,
    pageSize: number,
    filters: UserTasksFilters
  ): Promise<PaginatedTasks> => {
    const { data } = await apiClient.get(`/users/${userId}/tasks`, {
      params: {
        page,
        pageSize,
        status: filters.status,
        viewBy: filters.viewBy,
        types: filters.types && filters.types.length > 0 ? filters.types.join(',') : undefined,
      },
    });
    return data;
  },

  changeStatus: async (
    id: string,
    newStatus: number,
    assignedUserId: string,
    data: Record<string, any>
  ): Promise<Task> => {
    const { data: res } = await apiClient.post(`/tasks/${id}/status`, { newStatus, assignedUserId, data });
    return res;
  },

  close: async (id: string): Promise<Task> => {
    const { data } = await apiClient.post(`/tasks/${id}/close`);
    return data;
  },
};
