import { z } from "zod";

import { defaultText, notNullText, uuid } from "./baseValidations";

export const operationCreateSchema = z.object({
  accountId: uuid,
  categoryId: uuid,
  description: defaultText,
  hash: notNullText,
  id: uuid,
  localAmount: z.number(),
  originalAmount: z.number(),
});

export const operationResponseSchema = z
  .object({
    createdAt: z.string(),
    updatedAt: z.string(),
    userId: uuid,
  })
  .merge(operationCreateSchema);
