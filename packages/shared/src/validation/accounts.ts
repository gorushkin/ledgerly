import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  notNullText,
  requiredText,
  currencyCode,
  isoDatetime,
  uuid,
  moneyAmountString,
} from "./baseValidations";

const accountType = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  currency: currencyCode,
  description: requiredText,
  initialBalance: moneyAmountString,
  name: notNullText,
  type: accountType,
});

export const accountUpdateSchema = accountCreateSchema
  .pick({
    currency: true,
    description: true,
    name: true,
    type: true,
  })
  .partial();

export const accountResponseSchema = z.object({
  createdAt: isoDatetime,
  currency: currencyCode,
  currentClearedBalanceLocal: z.number(),
  description: requiredText,
  id: uuid,
  initialBalance: z.number(),
  name: requiredText,
  type: accountType,
  updatedAt: isoDatetime,
  userId: uuid,
});
