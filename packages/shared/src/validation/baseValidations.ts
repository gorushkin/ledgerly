import { z } from "zod";

import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "../constants/pagination";
import {
  DEFAULT_TRANSACTION_SORT_BY,
  DEFAULT_TRANSACTION_SORT_ORDER,
} from "../constants/transactions";

export const text = z.string();
export const optionalText = text.optional();
export const defaultText = text.default("");
export const requiredText = z
  .string()
  .trim()
  .min(1, "Required text must not be empty");
export const updatedAt = z.string();
export const createdAt = z.string();
export const uuid = z.string().uuid().brand<"UUID">();
export const dateText = z.string().refine((d) => !isNaN(Date.parse(d)), {
  message: "Invalid date format",
});
export const uniqueIdSchema = z.object({
  id: uuid,
});
export const isoDatetime = z.string().datetime().brand<"IsoDatetimeString">();

export const sha256String = z.string().regex(/^[a-f0-9]{64}$/, {
  message: "Must be a valid SHA-256 hash",
});

export const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .brand<"IsoDateString">();

export const amountString = z
  .string()
  .regex(/^-?\d+$/)
  .brand<"AmountString">();

export const amountBigint = z
  .string()
  .regex(/^-?\d+$/)
  .transform((val) => BigInt(val))
  .brand<"AmountBigint">();

export const getTransactionsQuerySchema = z
  .object({
    accountId: uuid.optional(),
    dateFrom: isoDate.optional(),
    dateTo: isoDate.optional(),
    page: z.coerce.number().int().positive().default(DEFAULT_PAGE),
    pageSize: z.coerce
      .number()
      .int()
      .positive()
      .max(MAX_PAGE_SIZE)
      .default(DEFAULT_PAGE_SIZE),
    sortBy: z
      .enum(["transactionDate", "postingDate"])
      .default(DEFAULT_TRANSACTION_SORT_BY),
    sortOrder: z.enum(["asc", "desc"]).default(DEFAULT_TRANSACTION_SORT_ORDER),
  })
  .superRefine(({ dateFrom, dateTo }, context) => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "dateFrom must be before or equal to dateTo",
        path: ["dateTo"],
      });
    }
  });
