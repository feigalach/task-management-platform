import { Stack, TextField, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { StatusFieldRequirement } from '../types';
import { FieldErrors } from '../validation/fieldValidation';

const useStyles = makeStyles({
  arrayGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
});

interface Props {
  fields: StatusFieldRequirement[];
  values: Record<string, any>;
  errors: FieldErrors;
  onChange: (key: string, value: any) => void;
}

/**
 * Renders inputs purely from a StatusFieldRequirement[] descriptor coming
 * from the server (GET /task-types) - no knowledge of "procurement" or
 * "development", so any future task type's fields render automatically.
 *
 * Fully controlled: value/onChange come from props, no local useState here.
 * That's what lets StatusChangeForm hold the field values in its own
 * state alongside the next-user selection, all submitted together.
 */
export const DynamicFieldsInputs = ({ fields, values, errors, onChange }: Props) => {
  const classes = useStyles();

  const setArrayItem = (key: string, index: number, value: string, length: number) => {
    const current = Array.isArray(values[key]) ? [...values[key]] : new Array(length).fill('');
    current[index] = value;
    onChange(key, current);
  };

  if (fields.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No additional data required for this status.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {fields.map((field) => (
        <div key={field.key}>
          {field.type === 'string' && (
            <TextField
              fullWidth
              size="small"
              label={field.label}
              value={values[field.key] ?? ''}
              onChange={(e) => onChange(field.key, e.target.value)}
              error={Boolean(errors[field.key])}
              helperText={errors[field.key] || ' '}
            />
          )}

          {field.type === 'number' && (
            <TextField
              fullWidth
              size="small"
              type="number"
              label={field.label}
              value={values[field.key] ?? ''}
              onChange={(e) => onChange(field.key, Number(e.target.value))}
              error={Boolean(errors[field.key])}
              helperText={errors[field.key] || ' '}
            />
          )}

          {field.type === 'string[]' && (
            <div className={classes.arrayGroup}>
              {Array.from({ length: field.maxItems ?? field.minItems ?? 1 }).map((_, i) => (
                <TextField
                  key={i}
                  fullWidth
                  size="small"
                  label={`${field.label} #${i + 1}`}
                  value={(values[field.key] && values[field.key][i]) ?? ''}
                  onChange={(e) =>
                    setArrayItem(field.key, i, e.target.value, field.maxItems ?? field.minItems ?? 1)
                  }
                />
              ))}
              <Typography variant="caption" color="error">
                {errors[field.key] || ' '}
              </Typography>
            </div>
          )}
        </div>
      ))}
    </Stack>
  );
}
