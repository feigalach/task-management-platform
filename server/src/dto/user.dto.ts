import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().trim().min(1),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;