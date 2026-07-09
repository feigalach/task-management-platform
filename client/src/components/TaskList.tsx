import { Stack, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { Task, TaskTypeDescriptor, User } from '../types';
import { TaskCard } from './TaskCard';

const useStyles = makeStyles((theme: Theme) => ({
  group: {
    marginBottom: theme.spacing(2.5),
    '&:last-child': {
      marginBottom: 0,
    },
  },
  groupLabel: {
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    marginBottom: theme.spacing(1),
  },
}));

interface Props {
  tasks: Task[];
  taskTypes: TaskTypeDescriptor[];
  users: User[];
  onChanged: () => void;
}

/**
 * Open tasks first, then closed - within each group the server already
 * orders by updatedAt DESC (most recently changed first, so any status
 * change bumps a task back to the top), and filtering here preserves
 * that relative order.
 */
export const TaskList = ({ tasks, taskTypes, users, onChanged }: Props) => {
  const classes = useStyles();

  if (tasks.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No tasks to display.
      </Typography>
    );
  }

  const open = tasks.filter((t) => !t.isClosed);
  const done = tasks.filter((t) => t.isClosed);

  const renderGroup = (label: string, items: Task[]) =>
    items.length > 0 && (
      <div className={classes.group} key={label}>
        <Typography variant="caption" color="text.secondary" className={classes.groupLabel} display="block">
          {label} ({items.length})
        </Typography>
        <Stack spacing={1.25}>
          {items.map((t) => (
            <TaskCard
              key={t.id}
              task={t}
              typeDescriptor={taskTypes.find((td) => td.type === t.type)}
              users={users}
              onChanged={onChanged}
            />
          ))}
        </Stack>
      </div>
    );

  return (
    <div>
      {renderGroup('To Do', open)}
      {renderGroup('Done', done)}
    </div>
  );
}
