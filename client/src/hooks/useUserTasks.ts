import { useCallback, useEffect, useRef, useState } from 'react';
import { getApiErrorMessage } from '../api/errorMessage';
import { taskApi, UserTasksFilters } from '../api/taskApi';
import { PaginatedTasks } from '../types';

export const TASKS_PAGE_SIZE = 10;

export type TaskStatusFilter = 'all' | 'open' | 'closed' | 'none';

export interface UserTasksFilterState {
  status: TaskStatusFilter;
  viewBy: UserTasksFilters['viewBy'];
  types?: string[];
}

const buildCacheKey = (userId: string, page: number, filters: UserTasksFilterState): string => {
  return JSON.stringify({ userId, page, status: filters.status, viewBy: filters.viewBy, types: filters.types ?? null });
}

export const useUserTasks = (userId: string, page: number, filters: UserTasksFilterState) => {
  const [data, setData] = useState<PaginatedTasks | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, PaginatedTasks>>(new Map());

  const fetchData = useCallback(
    async (opts?: { force?: boolean }) => {
      const noTypesSelected = filters.types !== undefined && filters.types.length === 0;
      if (!userId || filters.status === 'none' || noTypesSelected) {
        setData(null);
        return;
      }

      const key = buildCacheKey(userId, page, filters);

      if (opts?.force) {
        // Data changed server-side - every cached page for every user
        // could now be stale (counts shift, order changes, ownership can
        // even move to a different user), so drop everything rather than
        // trying to guess which entries are still valid.
        cacheRef.current.clear();
      } else {
        const cached = cacheRef.current.get(key);
        if (cached) {
          setData(cached);
          return;
        }
      }

      setIsFetching(true);
      setError(null);
      try {
        const apiFilters: UserTasksFilters = {
          status: filters.status as 'all' | 'open' | 'closed',
          viewBy: filters.viewBy,
          types: filters.types,
        };
        const result = await taskApi.getUserTasks(userId, page, TASKS_PAGE_SIZE, apiFilters);
        cacheRef.current.set(key, result);
        setData(result);
      } catch (err: any) {
        setError(getApiErrorMessage(err, 'Failed to load tasks'));
      } finally {
        setIsFetching(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, page, filters.status, filters.viewBy, filters.types?.join(',')]
  );

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData]);

  const refetch = useCallback(() => fetchData({ force: true }), [fetchData]);

  return { data, isFetching, error, refetch };
}
