import { z } from "zod";

import { uuid } from "./baseValidations";

const description = z.string().trim().max(500).default("");

export const money = z.bigint();
export const fxRateScaled = z.bigint();
export const operationCreateSchema = z.object({
  accountId: uuid,
  baseAmount: money,
  description,
  localAmount: money,
  rateBasePerLocal: fxRateScaled,
});

export const operationUpdateSchema = operationCreateSchema
  .pick({
    accountId: true,
    baseAmount: true,
    description: true,
    localAmount: true,
    rateBasePerLocal: true,
  })
  .optional();
