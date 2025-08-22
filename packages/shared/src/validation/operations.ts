import { z } from "zod";

import { uuid } from "./baseValidations";

export const money = z.bigint();
export const fxRateScaled = z.bigint();
export const operationCreateSchema = z.object({
  accountId: uuid,
  baseAmount: money,
  description: z.string().trim().max(500).default(""),
  isTombstone: z.boolean().default(false),
  localAmount: money,
  rateBasePerLocal: fxRateScaled,
  transactionId: uuid,
  userId: uuid,
});

export const operationUpdateSchema = z
  .object({
    accountId: uuid.optional(),
    baseAmount: money.optional(),
    description: z.string().trim().max(500).optional(),
    isTombstone: z.boolean().optional(),
    localAmount: money.nullish().optional(),
    rateBasePerLocal: fxRateScaled.nullish().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "Provide at least one field",
  });
