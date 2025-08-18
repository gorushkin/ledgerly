import { z } from "zod";

import {
  currencyCode,
  isoDatetime,
  sha256String,
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
export type Sha256String = z.infer<typeof sha256String>;
