import { z } from "zod";

import {
  currencyCode,
  isoDate,
  isoDatetime,
  sha256String,
  uuid,
  amountString,
} from "../validation/baseValidations";

export type CurrencyCode = z.infer<typeof currencyCode>;

export type IsoDatetimeString = z.infer<typeof isoDatetime>;
export type IsoDateString = z.infer<typeof isoDate>;
export type Sha256String = z.infer<typeof sha256String>;

export type UUID = z.infer<typeof uuid>;

export type AmountString = z.infer<typeof amountString>;
