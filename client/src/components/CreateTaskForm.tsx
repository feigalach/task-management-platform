import { Box, Button, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent, Stack, Typography } from '@mui/material';
import { FormEvent, useState } from 'react';
import { getApiErrorMessage } from '../api/errorMessage';
import { taskApi } from '../api/taskApi';
import { TaskTypeDescriptor, User } from '../types';
import { requiredMessage } from '../validation/fieldValidation';
import { UserSelector } from './UserSelector';

interface Props {
  taskTypes: TaskTypeDescriptor[];
  users: User[];
  currentUserId: string;
  onCreated: () => void;
}

export const CreateTaskForm = ({ taskTypes, users, currentUserId, onCreated }: Props) => {
  const [type, setType] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');
  const [typeError, setTypeError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const handleTypeChange = (e: SelectChangeEvent) => {
    setType(e.target.value);
    setTypeError(null);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError(null);

    // Friendly client-side required-field check before ever hitting the API.
    const tErr = requiredMessage(type, 'task type');
    const uErr = requiredMessage(assignedUserId, 'user');
    setTypeError(tErr);
    setUserError(uErr);
    if (tErr || uErr) return;

    try {
      await taskApi.create(type, assignedUserId, currentUserId);
      setType('');
      setAssignedUserId('');
      onCreated();
    } catch (err: any) {
      setServerError(getApiErrorMessage(err, 'Failed to create task'));
    }
  };

  return (
    <Box component="form" onSubmit={submit}>
      <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
        Create Task
      </Typography>

      <Stack spacing={2}>
        <FormControl fullWidth size="small" error={Boolean(typeError)}>
          <InputLabel id="task-type-select">Task type</InputLabel>
          <Select labelId="task-type-select" label="Task type" value={type} onChange={handleTypeChange}>
            {taskTypes.map((t) => (
              <MenuItem key={t.type} value={t.type}>
                {t.type}
              </MenuItem>
            ))}
          </Select>
          <Typography variant="caption" color="error" sx={{ minHeight: 20, display: 'block', mt: 0.5 }}>
            {typeError || ' '}
          </Typography>
        </FormControl>

        <div>
          <UserSelector
            users={users}
            value={assignedUserId}
            label="Assign to"
            onChange={(id) => {
              setAssignedUserId(id);
              setUserError(null);
            }}
          />
          <Typography variant="caption" color="error" sx={{ minHeight: 20, display: 'block', mt: 0.5 }}>
            {userError || ' '}
          </Typography>
        </div>

        <Button type="submit" variant="contained">
          Create Task
        </Button>

        <Typography variant="caption" color="error" sx={{ minHeight: 20 }}>
          {serverError || ' '}
        </Typography>
      </Stack>
    </Box>
  );
}
