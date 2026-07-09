import { User } from '../types';
import { apiClient } from './client';

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },
};
