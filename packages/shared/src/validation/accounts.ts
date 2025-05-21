import { z } from "zod";
import { ACCOUNT_TYPES, CURRENCIES } from "../constants";

export const accountCreateSchema = z.object({
  name: z.string().min(1),
  currency_code: z.enum(CURRENCIES.map((t) => t.code) as [string, ...string[]]),
  type: z.enum(ACCOUNT_TYPES.map((t) => t.value) as [string, ...string[]]),
  description: z.string().optional(),
  initialBalance: z.number().default(0).optional(),
});

export const accountResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  type: z.enum(ACCOUNT_TYPES.map((t) => t.value) as [string, ...string[]]),
  currency_code: z.enum(CURRENCIES.map((t) => t.code) as [string, ...string[]]),
  description: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
