import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  notNullText,
  requiredText,
  currencyCode,
  uuid,
} from "./baseValidations";

const accountType = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  description: requiredText,
  initialBalance: z.number(),
  name: notNullText,
  originalCurrency: currencyCode,
  type: accountType,
});

export const accountUpdateSchema = accountCreateSchema
  .pick({
    description: true,
    name: true,
    // check if originalCurrency should be changed
    originalCurrency: true,
    type: true,
  })
  .partial();

export const isoDatetime = z.string();
// export const isoDatetime = z.string().datetime().brand<"IsoDatetimeString">();
export type IsoDatetimeString = z.infer<typeof isoDatetime>;

export const accountResponseSchema = z.object({
  createdAt: isoDatetime,
  currentClearedBalanceLocal: z.number(),
  description: requiredText,
  id: uuid,
  initialBalance: z.number(),
  name: requiredText,
  originalCurrency: currencyCode,
  type: accountType,
  updatedAt: isoDatetime,
});
