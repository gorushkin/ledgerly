import { z } from "zod";

import {
  currencyCode,
  isoDate,
  isoDatetime,
  sha256String,
  uuid,
  moneyAmountString,
  getTransactionsQuerySchema,
} from "../validation/baseValidations";

export type ErrorResponse = {
  error: string;
  message: string;
};

export type ValidationError = {
  error: true;
  errors: [
    {
      code: string;
      field: string;
      message: string;
    },
  ];
};

export type CurrencyCode = z.infer<typeof currencyCode>;

export type IsoDatetimeString = z.infer<typeof isoDatetime>;
export type IsoDateString = z.infer<typeof isoDate>;
export type Sha256String = z.infer<typeof sha256String>;

export type UUID = z.infer<typeof uuid>;

export type MoneyString = z.infer<typeof moneyAmountString>;

export type Brand<T, B extends string> = T & { readonly __brand: B };

export type Money = Brand<number, "Money">;

export type TransactionQueryParams = z.infer<typeof getTransactionsQuerySchema>;
