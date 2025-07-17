import { z } from "zod";

import { dateText, defaultText, uuid } from "./baseValidations";
import { operationCreateSchema, operationResponseSchema } from "./operations";

export const transactionCreateSchema = z.object({
  description: defaultText,
  operations: z.array(operationCreateSchema).nonempty(),
  postingDate: dateText,
  transactionDate: dateText,
});

export const transactionResponseSchema = z
  .object({
    id: uuid,
    operations: z.array(operationResponseSchema),
  })
  .merge(transactionCreateSchema.omit({ operations: true }));
