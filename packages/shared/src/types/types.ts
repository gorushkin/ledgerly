import { z } from "zod";

import {
  isoDate,
  isoDatetime,
  sha256String,
  uuid,
  amountString,
  requiredText,
} from "../validation/baseValidations";

export type IsoDatetimeString = z.infer<typeof isoDatetime>;
export type IsoDateString = z.infer<typeof isoDate>;
export type Sha256String = z.infer<typeof sha256String>;
export type UUID = z.infer<typeof uuid>;
export type AmountString = z.infer<typeof amountString>;
export type RequiredText = z.infer<typeof requiredText>;
