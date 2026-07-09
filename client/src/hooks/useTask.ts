import { useCallback, useEffect, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { Task } from '../types';

export const useTask = (taskId: string) => {
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await taskApi.getOne(taskId);
      setTask(data);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { task, loading, error, refetch };
}
