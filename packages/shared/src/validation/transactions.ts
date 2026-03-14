import { z } from "zod";

import {
  uuid,
  requiredText,
  isoDate,
  isoDatetime,
  moneyAmountString,
  currencyCode,
} from "./baseValidations";

// amount — posting in the account's native currency
// value  — posting in the transaction's currency (GnuCash convention)
// For same-currency transactions amount === value.
// Transaction balance is validated by summing value across all operations (must equal 0).
export const operationCreateSchema = z.object({
  accountId: uuid,
  amount: moneyAmountString,
  description: requiredText,
  value: moneyAmountString,
});

// See operationCreateSchema for amount/value distinction.
export const operationUpdateSchema = z.object({
  accountId: uuid,
  amount: moneyAmountString,
  description: requiredText,
  id: uuid,
  value: moneyAmountString,
});

export const transactionCreateSchema = z.object({
  currencyCode: currencyCode,
  description: requiredText,
  operations: z.array(operationCreateSchema),
  postingDate: isoDate,
  transactionDate: isoDate,
});

export const transactionUpdateSchema = z.object({
  description: requiredText,
  operations: z.object({
    create: z.array(operationCreateSchema),
    delete: z.array(uuid),
    update: z.array(operationUpdateSchema),
  }),
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
