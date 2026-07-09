import { z } from 'zod';

export const createTaskSchema = z.object({
  type: z.string().min(1),
  assignedUserId: z.string().uuid(),
  createdByUserId: z.string().uuid(),
});

export const changeStatusSchema = z.object({
  newStatus: z.number().int().positive(),
  assignedUserId: z.string().uuid(),
  data: z.record(z.string(), z.any()).optional().default({}),
});

export type CreateTaskDto = z.infer<typeof createTaskSchema>;
export type ChangeStatusDto = z.infer<typeof changeStatusSchema>;
