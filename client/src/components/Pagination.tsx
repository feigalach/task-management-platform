import MuiPagination from '@mui/material/Pagination';
import { Stack, Typography } from '@mui/material';

interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export const Pagination = ({ page, pageSize, total, onPageChange, disabled }: Props) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (totalPages <= 1) return null;

  return (
    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" sx={{ mt: 2 }}>
      <MuiPagination
        count={totalPages}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        disabled={disabled}
        color="primary"
        shape="rounded"
      />
      <Typography variant="caption" color="text.secondary">
        {total} tasks
      </Typography>
    </Stack>
  );
}
