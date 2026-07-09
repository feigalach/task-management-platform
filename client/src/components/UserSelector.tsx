import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';
import { memo } from 'react';
import { User } from '../types';

interface Props {
  users: User[];
  value: string;
  onChange: (userId: string) => void;
  label?: string;
  size?: 'small' | 'medium';
}

/**
 * Purely controlled - `users` comes from a prop, fetched exactly once at
 * the top of the app (see hooks/useUsers.ts) and passed down everywhere
 * this selector is used (top filter, create-task form, next-assigned-user
 * picker). No component here calls GET /users itself.
 */
export const UserSelector = memo(function UserSelector({ users, value, onChange, label = 'User', size = 'small' }: Props) {
  const handleChange = (e: SelectChangeEvent) => onChange(e.target.value);

  return (
    <FormControl fullWidth size={size}>
      <InputLabel id={`user-select-${label}`}>{label}</InputLabel>
      <Select labelId={`user-select-${label}`} label={label} value={value} onChange={handleChange}>
        {users.map((u) => (
          <MenuItem key={u.id} value={u.id}>
            {u.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
});
