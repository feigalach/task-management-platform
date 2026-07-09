import { Stack, Typography } from '@mui/material';
import { useTaskHistory } from '../hooks/useTaskHistory';
import { TaskHistoryEntry, User } from '../types';

interface Props {
  taskId: string;
  users: User[];
  refreshKey?: string | number;
}

const userName = (users: User[], id: string | null): string => {
  if (!id) return '—';
  return users.find((u) => u.id === id)?.name ?? id;
}

const describe = (entry: TaskHistoryEntry, users: User[]): string => {
  const when = new Date(entry.createdAt).toLocaleString();
  const toUser = userName(users, entry.toUserId);

  if (entry.action === 'created') {
    return `Created at status ${entry.toStatus}, assigned to ${toUser} · ${when}`;
  }
  if (entry.action === 'closed') {
    return `Closed at status ${entry.toStatus} (owner: ${toUser}) · ${when}`;
  }
  const fromUser = userName(users, entry.fromUserId);
  return `Status ${entry.fromStatus} → ${entry.toStatus}, reassigned ${fromUser} → ${toUser} · ${when}`;
}

export const TaskHistoryView = ({ taskId, users, refreshKey }: Props) => {
  const { history, error } = useTaskHistory(taskId, refreshKey);

  if (error) {
    return (
      <Typography variant="body2" color="error">
        {error}
      </Typography>
    );
  }

  if (!history) {
    return (
      <Typography variant="body2" color="text.secondary">
        Loading history...
      </Typography>
    );
  }

  if (history.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No history yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.5}>
      {history.map((entry) => (
        <Typography key={entry.id} variant="caption" color="text.secondary" display="block">
          {describe(entry, users)}
        </Typography>
      ))}
    </Stack>
  );
}
