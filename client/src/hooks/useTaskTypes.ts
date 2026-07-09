import { useEffect, useState } from 'react';
import { taskApi } from '../api/taskApi';
import { TaskTypeDescriptor } from '../types';

export const useTaskTypes = () => {
  const [taskTypes, setTaskTypes] = useState<TaskTypeDescriptor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskApi.getTaskTypes().then((data) => {
      setTaskTypes(data);
      setLoading(false);
    });
  }, []);

  return { taskTypes, loading };
}
