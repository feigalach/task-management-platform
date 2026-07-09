import { Box, Button, Stack, Theme, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { FormEvent, useState } from 'react';
import { StatusDefinition, User } from '../types';
import { FieldErrors, requiredMessage, validateDynamicFields } from '../validation/fieldValidation';
import { DynamicFieldsInputs } from './DynamicFieldsInputs';
import { UserSelector } from './UserSelector';

const useStyles = makeStyles((theme: Theme) => ({
  root: {
    border: `1px dashed ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    background: theme.palette.background.paper,
  },
  actions: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: theme.spacing(2),
  },
  errorText: {
    minHeight: 20,
  },
}));

interface Props {
  targetStatusDef: StatusDefinition;
  defaultUserId: string;
  initialFieldValues: Record<string, any>;
  users: User[];
  onCancel: () => void;
  onSave: (nextUserId: string, data: Record<string, any>) => void;
  submitting: boolean;
  submitError: string | null;
}

/**
 * One form for a status change: the next-assigned-user selector and every
 * field the target status requires, all together, submitted with a single
 * Save button - no internal Next/Back sub-steps.
 */
export const StatusChangeForm = ({
  targetStatusDef,
  defaultUserId,
  initialFieldValues,
  users,
  onCancel,
  onSave,
  submitting,
  submitError,
}: Props) => {
  const classes = useStyles();
  const [nextUserId, setNextUserId] = useState(defaultUserId);
  const [userError, setUserError] = useState<string | null>(null);
  const [fieldValues, setFieldValues] = useState<Record<string, any>>(initialFieldValues);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleFieldChange = (key: string, value: any) => {
    setFieldValues((v) => ({ ...v, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: '' }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const uErr = requiredMessage(nextUserId, 'user');
    const fErrs = validateDynamicFields(targetStatusDef.requiredFields, fieldValues);
    setUserError(uErr);
    setFieldErrors(fErrs);
    if (uErr || Object.keys(fErrs).length > 0) return;

    onSave(nextUserId, fieldValues);
  };

  return (
    <Box component="form" className={classes.root} onSubmit={handleSubmit}>
      <Typography variant="subtitle2" gutterBottom>
        Move to status {targetStatusDef.number}: {targetStatusDef.name}
      </Typography>

      <Stack spacing={2}>
        <div>
          <UserSelector
            users={users}
            value={nextUserId}
            label="Next assigned user"
            onChange={(id) => {
              setNextUserId(id);
              setUserError(null);
            }}
          />
          <Typography variant="caption" color="error" className={classes.errorText}>
            {userError || ' '}
          </Typography>
        </div>

        <DynamicFieldsInputs
          fields={targetStatusDef.requiredFields}
          values={fieldValues}
          errors={fieldErrors}
          onChange={handleFieldChange}
        />
      </Stack>

      <Typography variant="caption" color="error" className={classes.errorText}>
        {submitError || ' '}
      </Typography>

      <div className={classes.actions}>
        <Button variant="outlined" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </Box>
  );
}
