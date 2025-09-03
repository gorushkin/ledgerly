import { z } from "zod";

import {
  uuid,
  requiredText,
  notNullText,
  isoDate,
  isoDatetime,
} from "./baseValidations";

export const transactionCreateSchema = z.object({
  description: requiredText,
  hash: notNullText,
  id: uuid,
  postingDate: isoDate,
  transactionDate: isoDate,
  userId: uuid,
});

export const transactionUpdateSchema = z.object({
  description: requiredText,
  id: uuid,
  postingDate: isoDate,
  transactionDate: isoDate,
});

export const transactionResponseSchema = z.object({
  createdAt: isoDatetime,
  description: requiredText,
  id: uuid,
  isTombstone: z.boolean(),
  postingDate: isoDate,
  transactionDate: isoDate,
  updatedAt: isoDatetime,
  userId: uuid,
});

export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
