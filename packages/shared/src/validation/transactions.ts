import { z } from "zod";

import {
  uuid,
  requiredText,
  isoDate,
  isoDatetime,
  moneyAmountString,
} from "./baseValidations";

export const operationCreateSchema = z.object({
  accountId: uuid,
  amount: moneyAmountString,
  description: requiredText,
});

export const entryCreateSchema = z.object({
  from: operationCreateSchema,
  to: operationCreateSchema,
});

export const transactionCreateSchema = z.object({
  description: requiredText,
  entries: z.array(entryCreateSchema),
  postingDate: isoDate,
  transactionDate: isoDate,
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
