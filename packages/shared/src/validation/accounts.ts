import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  requiredText,
  textWithDefault,
  uuid,
  amountString,
} from "./baseValidations";

const accountType = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  commodityId: uuid,
  description: textWithDefault,
  initialBalance: amountString,
  name: requiredText,
  type: accountType,
});

export const accountUpdateSchema = accountCreateSchema
  .pick({
    description: true,
    name: true,
    type: true,
  })
  .partial();
