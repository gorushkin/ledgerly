import { z } from "zod";

import { ACCOUNT_TYPE_VALUES, CURRENCY_TYPE_VALUES } from "../constants";

import {
  createdAt,
  description,
  name,
  updatedAt,
  uuid,
} from "./baseValidations";

const type = z.enum(ACCOUNT_TYPE_VALUES);
const currency_code = z.enum(CURRENCY_TYPE_VALUES);

export const accountCreateSchema = z.object({
  currency_code,
  description,
  initialBalance: z.number().default(0).optional(),
  name,
  type,
});

export const accountResponseSchema = z.object({
  createdAt,
  currency_code,
  description,
  id: uuid,
  name,
  type,
  updatedAt,
});
