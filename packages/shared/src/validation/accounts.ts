import { z } from "zod";

import { ACCOUNT_TYPE_VALUES } from "../constants";

import {
  defaultText,
  optionalText,
  requiredText,
  uuid,
  amountString,
} from "./baseValidations";

const accountType = z.enum(ACCOUNT_TYPE_VALUES);

export const accountCreateSchema = z.object({
  commodityId: uuid,
  description: defaultText,
  initialBalance: amountString,
  name: requiredText,
  type: accountType,
});

export const accountUpdateSchema = z.object({
  description: optionalText,
  name: requiredText.optional(),
  type: accountType.optional(),
});
