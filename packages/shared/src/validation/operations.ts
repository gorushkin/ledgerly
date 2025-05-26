import { z } from "zod";

import { defaultText, uuid } from "./baseValidations";

export const operationCreateSchema = z.object({
  accountId: uuid,
  amount: z.number(),
  categoryId: uuid,
  description: defaultText,
  localAmount: z.number(),
  originalAmount: z.number(),
  transactionId: z.string().optional(),
});
