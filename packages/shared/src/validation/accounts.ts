import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  notNullText,
  requiredText,
  uuid,
  amountString,
} from "./baseValidations";

const accountType = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  commodityId: uuid,
  description: requiredText,
  initialBalance: amountString,
  name: notNullText,
  type: accountType,
});

export const accountUpdateSchema = accountCreateSchema
  .pick({
    description: true,
    name: true,
    type: true,
  })
  .partial();
