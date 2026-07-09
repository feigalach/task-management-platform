import { Box, Button, Divider, Stack, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useState } from 'react';
import { getApiErrorMessage } from '../api/errorMessage';
import { taskApi } from '../api/taskApi';
import { Task, TaskTypeDescriptor, User } from '../types';
import { CustomFieldsView } from './CustomFieldsView';
import { StatusChangeForm } from './StatusChangeForm';
import { TaskHistoryView } from './TaskHistoryView';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    padding: theme.spacing(2),
  },
}));

interface Props {
  task: Task;
  typeDescriptor: TaskTypeDescriptor;
  users: User[];
  onChanged: () => void;
}

/**
 * The task's current status is the step: it decides whether Back/Forward/
 * Close are on screen. Picking one swaps the buttons for a single
 * StatusChangeForm (all fields, one Save button) - never both at once.
 */
export const TaskCardDetails = ({ task, typeDescriptor, users, onChanged }: Props) => {
  const classes = useStyles();
  const [targetStatus, setTargetStatus] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const forwardDef = typeDescriptor.statuses.find((s) => s.number === task.status + 1);
  const backwardDef = typeDescriptor.statuses.find((s) => s.number === task.status - 1);
  const isFinalStatus = task.status === typeDescriptor.finalStatus;
  const targetStatusDef =
    targetStatus !== null ? typeDescriptor.statuses.find((s) => s.number === targetStatus) : undefined;

  const openTransition = (status: number) => {
    setActionError(null);
    setSubmitError(null);
    setTargetStatus(status);
  };

  const cancelTransition = () => {
    setTargetStatus(null);
    setSubmitError(null);
  };

  const saveTransition = async (nextUserId: string, data: Record<string, any>) => {
    if (targetStatus === null) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await taskApi.changeStatus(task.id, targetStatus, nextUserId, data);
      setTargetStatus(null);
      onChanged();
    } catch (err: any) {
      setSubmitError(getApiErrorMessage(err, 'Failed to change status'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = async () => {
    setActionError(null);
    try {
      await taskApi.close(task.id);
      onChanged();
    } catch (err: any) {
      setActionError(getApiErrorMessage(err, 'Failed to close task'));
    }
  };

  const ownerName = users.find((u) => u.id === task.assignedUserId)?.name ?? task.assignedUserId;
  const creatorName = users.find((u) => u.id === task.createdByUserId)?.name ?? task.createdByUserId;

  return (
    <Box className={classes.root}>
      <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
        Created by <strong>{creatorName}</strong> · Owner: <strong>{ownerName}</strong>
      </Typography>

      <CustomFieldsView customFields={task.customFields} typeDescriptor={typeDescriptor} />

      {actionError && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {actionError}
        </Typography>
      )}

      {!task.isClosed && targetStatus === null && (
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
          {backwardDef && (
            <Button variant="outlined" onClick={() => openTransition(task.status - 1)}>
              ← Back to {backwardDef.number}: {backwardDef.name}
            </Button>
          )}
          {forwardDef && (
            <Button variant="contained" onClick={() => openTransition(task.status + 1)}>
              Forward to {forwardDef.number}: {forwardDef.name} →
            </Button>
          )}
          {isFinalStatus && (
            <Button variant="contained" color="success" onClick={handleClose}>
              Close Task
            </Button>
          )}
        </Stack>
      )}

      {!task.isClosed && targetStatusDef && (
        <StatusChangeForm
          targetStatusDef={targetStatusDef}
          defaultUserId={task.assignedUserId}
          users={users}
          onCancel={cancelTransition}
          onSave={saveTransition}
          submitting={submitting}
          submitError={submitError}
          initialFieldValues={task.customFields}
        />
      )}

      {task.isClosed && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This task is closed.
        </Typography>
      )}

      <Divider sx={{ my: 1.5 }} />

      <Typography variant="overline" color="text.secondary" display="block" gutterBottom>
        History
      </Typography>
      <TaskHistoryView taskId={task.id} users={users} refreshKey={task.updatedAt} />
    </Box>
  );
}
