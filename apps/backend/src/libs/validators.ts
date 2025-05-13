import { z } from 'zod';

export const numericIdSchema = z.object({
  id: z.string().regex(/^\d+$/).transform(Number),
});

export const uniqueIdSchema = z.object({
  id: z.string().uuid(),
});
