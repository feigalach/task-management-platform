import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Avatar, Box, Card, Collapse, IconButton, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import clsx from 'clsx';
import { memo, useState } from 'react';
import { Task, TaskTypeDescriptor, User } from '../types';
import { TaskCardDetails } from './TaskCardDetails';

const useStyles = makeStyles((theme: Theme) => ({
  card: {
    overflow: 'hidden',
  },
  cardClosed: {
    background: theme.palette.grey[50],
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    padding: theme.spacing(1.5, 2),
    cursor: 'pointer',
  },
  icon: {
    width: 28,
    height: 28,
    fontSize: 14,
    fontWeight: 700,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  titleClosed: {
    color: theme.palette.text.secondary,
    textDecoration: 'line-through',
  },
  expandIcon: {
    transform: 'rotate(0deg)',
    transition: theme.transitions.create('transform', { duration: 150 }),
  },
  expandIconOpen: {
    transform: 'rotate(90deg)',
  },
  details: {
    borderTop: `1px solid ${theme.palette.divider}`,
    background: theme.palette.grey[50],
  },
}));

// A small fixed palette, picked deterministically from the task TYPE
// STRING itself (hash → index). A brand new task type automatically gets
// a color with zero code changes - nothing here is per-type.
const TYPE_COLORS = ['#C9B6E4', '#9FD8CB', '#F6C89F', '#F2A0A0', '#A7C7E7'];
const colorForType = (type: string): string => {
  let hash = 0;
  for (let i = 0; i < type.length; i++) {
    hash = type.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TYPE_COLORS[Math.abs(hash) % TYPE_COLORS.length];
}

interface Props {
  task: Task;
  typeDescriptor: TaskTypeDescriptor | undefined;
  users: User[];
  onChanged: () => void;
}

export const TaskCard = memo(function TaskCard({ task, typeDescriptor, users, onChanged }: Props) {
  const classes = useStyles();
  const [expanded, setExpanded] = useState(false);
  const currentDef = typeDescriptor?.statuses.find((s) => s.number === task.status);
  const ownerName = users.find((u) => u.id === task.assignedUserId)?.name;

  return (
    <Card variant="outlined" className={clsx(classes.card, { [classes.cardClosed]: task.isClosed })}>
      <Box className={classes.row} onClick={() => setExpanded((e) => !e)}>
        <Avatar
          className={classes.icon}
          sx={task.isClosed ? { bgcolor: 'success.main' } : { bgcolor: colorForType(task.type) }}
          variant="rounded"
        >
          {task.isClosed ? '✓' : ''}
        </Avatar>

        <Box className={classes.main}>
          <Typography variant="body2" fontWeight={600} className={task.isClosed ? classes.titleClosed : undefined}>
            {task.type} — {currentDef?.name ?? `Status ${task.status}`}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {ownerName ? (
              <>
                Owner: <strong>{ownerName}</strong>
              </>
            ) : (
              'Loading owner...'
            )}
            {' · Updated '}
            {new Date(task.updatedAt).toLocaleString()}
          </Typography>
        </Box>

        <IconButton size="small" className={clsx(classes.expandIcon, { [classes.expandIconOpen]: expanded })}>
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      <Collapse in={expanded} unmountOnExit>
        <Box className={classes.details}>
          {typeDescriptor && (
            <TaskCardDetails task={task} typeDescriptor={typeDescriptor} users={users} onChanged={onChanged} />
          )}
        </Box>
      </Collapse>
    </Card>
  );
});
