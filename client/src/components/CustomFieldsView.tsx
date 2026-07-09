import { Box, Stack, Typography } from '@mui/material';
import { StatusFieldRequirement, TaskTypeDescriptor } from '../types';

interface Props {
  customFields: Record<string, any>;
  typeDescriptor: TaskTypeDescriptor;
}

const isFilled = (value: any): boolean => {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.some((v) => String(v).trim() !== '');
  return String(value).trim() !== '';
}

const formatValue = (value: any): string => {
  return Array.isArray(value) ? value.filter((v) => String(v).trim() !== '').join(', ') : String(value);
}

/**
 * Every field that could ever appear on this task type comes from
 * typeDescriptor.statuses[].requiredFields - never hard-coded field names.
 * Only fields that actually have a value on this particular task are
 * shown, as "Label: value" rows - no raw JSON, no literal "customFields"
 * anywhere in the UI.
 */
export const CustomFieldsView = ({ customFields, typeDescriptor }: Props) => {
  const allFieldDefs = typeDescriptor.statuses.flatMap((s) => s.requiredFields);
  const seen = new Set<string>();
  const uniqueFields: StatusFieldRequirement[] = [];
  for (const f of allFieldDefs) {
    if (!seen.has(f.key)) {
      seen.add(f.key);
      uniqueFields.push(f);
    }
  }

  const filled = uniqueFields.filter((f) => isFilled(customFields[f.key]));

  if (filled.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No additional details yet.
      </Typography>
    );
  }

  return (
    <Stack spacing={0.75}>
      {filled.map((f) => (
        <Box key={f.key} sx={{ display: 'flex', gap: 1 }}>
          <Typography variant="body2" fontWeight={600}>
            {f.label}:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {formatValue(customFields[f.key])}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}
