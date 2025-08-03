import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  createdAt,
  notNullText,
  defaultText,
  updatedAt,
  uuid,
  currencyCode,
} from "./baseValidations";

const type = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  description: defaultText,
  initialBalance: z.number(),
  name: notNullText,
  originalCurrency: currencyCode,
  type,
  userId: uuid,
});

export const accountUpdateSchema = z
  .object({
    description: defaultText,
    name: notNullText,
    originalCurrency: currencyCode,
    type,
  })
  .partial();

export const accountResponseSchema = z
  .object({
    createdAt,
    id: uuid,
    updatedAt,
  })
  .merge(accountCreateSchema);
