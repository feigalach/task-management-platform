import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

export const taskListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['all', 'open', 'closed']).optional().default('all'),
  // Which column `:userId` is matched against: 'assigned' = tasks
  // currently owned by this user (the normal "my tasks" view). 'created'
  // = tasks this user originally opened, regardless of who owns them now
  // (ownership moves around through status changes) - a different query
  // against a different column, not an extra AND condition on top of
  // 'assigned'.
  viewBy: z.enum(['assigned', 'created']).optional().default('assigned'),
  // Comma-separated task type names, e.g. "?types=procurement,development".
  // Parsed straight into a string[] (undefined = no type filter, meaning
  // all types). Never validated against a fixed enum of known types - any
  // string the client sends is passed through, so a brand new task type
  // works here with zero server changes.
  types: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(',').filter(Boolean) : undefined)),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type TaskListQuery = z.infer<typeof taskListQuerySchema>;
