import { useEffect, useState } from 'react';
import { userApi } from '../api/userApi';
import { User } from '../types';

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    userApi.getAll().then(setUsers);
  }, []);
  return users;
}
