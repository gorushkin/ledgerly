import { z } from "zod";

import {
  MAX_TRANSACTION_OPERATIONS,
  MIN_TRANSACTION_OPERATIONS,
} from "../constants/transactions";

import {
  uuid,
  text,
  defaultText,
  isoDate,
  amountString,
} from "./baseValidations";

// amount — posting in the account Commodity
// value  — posting in the transaction Commodity (GnuCash convention)
// For same-currency transactions amount === value.
// Transaction balance is validated by summing value across all operations (must equal 0).
export const operationCreateSchema = z.object({
  accountId: uuid,
  amount: amountString,
  description: defaultText,
  value: amountString,
});

// See operationCreateSchema for amount/value distinction.
export const operationUpdateSchema = z.object({
  accountId: uuid,
  amount: amountString,
  description: text,
  id: uuid,
  value: amountString,
});

export const transactionCreateSchema = z.object({
  commodityId: uuid,
  description: defaultText,
  operations: z
    .array(operationCreateSchema)
    .min(MIN_TRANSACTION_OPERATIONS)
    .max(MAX_TRANSACTION_OPERATIONS),
  postingDate: isoDate,
  transactionDate: isoDate,
});

export const transactionUpdateSchema = z.object({
  description: text,
  operations: z.object({
    create: z.array(operationCreateSchema).max(MAX_TRANSACTION_OPERATIONS),
    delete: z.array(uuid).max(MAX_TRANSACTION_OPERATIONS),
    update: z.array(operationUpdateSchema).max(MAX_TRANSACTION_OPERATIONS),
  }),
  postingDate: isoDate,
  transactionDate: isoDate,
  version: z.number().int().nonnegative(),
});

export type OperationCreateInput = z.infer<typeof operationCreateSchema>;
export type OperationUpdateInput = z.infer<typeof operationUpdateSchema>;
export type TransactionCreateInput = z.infer<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.infer<typeof transactionUpdateSchema>;
