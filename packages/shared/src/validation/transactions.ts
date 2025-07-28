import { z } from "zod";

import { dateText, defaultText, uuid, requiredText } from "./baseValidations";
import { operationCreateSchema, operationResponseSchema } from "./operations";

export const transactionCreateSchema = z.object({
  description: requiredText,
  operations: z.array(operationCreateSchema).refine((data) => {
    const transactionBalance = data.reduce(
      (acc, op) => acc + op.localAmount,
      0
    );
    return transactionBalance === 0;
  }),
  postingDate: dateText,
  transactionDate: dateText,
  userId: uuid,
});

export const transactionUpdateSchema = z.object({
  description: defaultText.optional(),
  operations: z.array(operationCreateSchema).nonempty().optional(),
  postingDate: dateText.optional(),
  transactionDate: dateText.optional(),
});

export const transactionResponseSchema = z
  .object({
    description: requiredText,
    id: uuid,
    operations: z.array(operationResponseSchema),
  })
  .merge(transactionCreateSchema.omit({ operations: true }));
