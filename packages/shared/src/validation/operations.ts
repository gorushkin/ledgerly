import { z } from "zod";

import { defaultText, uuid } from "./baseValidations";

export const operationCreateSchema = z.object({
  accountId: uuid,
  categoryId: uuid,
  description: defaultText,
  localAmount: z.number(),
  originalAmount: z.number(),
});

export const operationResponseSchema = z
  .object({
    createdAt: z.string(),
    id: uuid,
    updatedAt: z.string(),
  })
  .merge(operationCreateSchema);
