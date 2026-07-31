import { z } from "zod";

import { ACCOUNT_STATUS_FILTER_VALUES, ACCOUNT_TYPES } from "../constants";

import {
  defaultText,
  optionalText,
  requiredText,
  uuid,
  amountString,
} from "./baseValidations";

const accountType = z.enum(ACCOUNT_TYPES);
const accountName = requiredText.max(255);

export const accountCreateSchema = z
  .object({
    commodityId: uuid,
    description: defaultText,
    initialBalance: amountString,
    name: accountName,
    type: accountType,
  })
  .strict();

export const accountUpdateSchema = z
  .object({
    description: optionalText,
    name: accountName.optional(),
    type: accountType.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0);

export const accountQuerySchema = z.object({
  status: z.enum(ACCOUNT_STATUS_FILTER_VALUES).default("open"),
});

export type AccountQuery = z.infer<typeof accountQuerySchema>;
