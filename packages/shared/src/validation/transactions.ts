import { z } from "zod";

import { dateText, uuid, requiredText, notNullText } from "./baseValidations";
import { operationCreateSchema, operationResponseSchema } from "./operations";

const operationsSchema = z.array(operationCreateSchema).refine((data) => {
  const transactionBalance = data.reduce((acc, op) => acc + op.localAmount, 0);
  return transactionBalance === 0;
});

export const transactionBaseSchema = z.object({
  description: requiredText,
  hash: notNullText,
  id: uuid,
  postingDate: dateText,
  transactionDate: dateText,
  userId: uuid,
});

export const transactionCreateSchema = transactionBaseSchema.extend({
  operations: operationsSchema,
});

export const transactionUpdateSchema = transactionCreateSchema;

export const transactionResponseSchema = transactionBaseSchema.extend({
  operations: z.array(operationResponseSchema),
});
