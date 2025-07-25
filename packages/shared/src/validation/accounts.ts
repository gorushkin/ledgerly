import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  createdAt,
  notNullText,
  defaultText,
  updatedAt,
  uuid,
  defaultNumber,
  currencyCode,
} from "./baseValidations";

const type = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  description: defaultText,
  initialBalance: defaultNumber,
  name: notNullText,
  originalCurrency: currencyCode,
  type,
  userId: uuid,
});

export const accountResponseSchema = z
  .object({
    createdAt,
    id: uuid,
    updatedAt,
  })
  .merge(accountCreateSchema);

export const accountUpdateSchema = accountCreateSchema.partial();
