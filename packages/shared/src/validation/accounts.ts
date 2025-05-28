import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  createdAt,
  notNullText,
  defaultText,
  updatedAt,
  uuid,
  defaultNumber,
} from "./baseValidations";

const type = z.enum(ACCOUNT_TYPE_VALUES);

// TODO: update currency validation
const currency_code = z.string().length(3);

export const accountCreateSchema = z.object({
  currency_code,
  description: defaultText,
  initialBalance: defaultNumber,
  name: notNullText,
  type,
});

export const accountResponseSchema = z
  .object({
    createdAt,
    id: uuid,
    updatedAt,
  })
  .merge(accountCreateSchema);
