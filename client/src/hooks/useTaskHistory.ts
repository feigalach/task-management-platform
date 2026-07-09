import { useCallback, useEffect, useState } from 'react';
import { getApiErrorMessage } from '../api/errorMessage';
import { taskApi } from '../api/taskApi';
import { TaskHistoryEntry } from '../types';

/**
 * `refreshKey` should be something that changes every time the task is
 * updated (e.g. task.updatedAt). The component holding this hook usually
 * stays mounted across a status change (it doesn't unmount/remount), so
 * without a refreshKey the history would only ever be fetched once, on
 * first expand, and never again - even though a new entry was just
 * written server-side.
 */
export const useTaskHistory = (taskId: string, refreshKey?: string | number) => {
  const [history, setHistory] = useState<TaskHistoryEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setError(null);
    try {
      const result = await taskApi.getHistory(taskId);
      setHistory(result);
    } catch (err: any) {
      setError(getApiErrorMessage(err, 'Failed to load history'));
    }
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch, refreshKey]);

  return { history, error };
}
