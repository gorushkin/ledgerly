import { z } from "zod";

export type AccountType =
  | "cash"
  | "debit"
  | "credit"
  | "savings"
  | "investment";

import {
  accountCreateSchema,
  accountResponseSchema,
  accountUpdateSchema,
} from "../validation";

export type AccountCreate = z.infer<typeof accountCreateSchema>;
export type AccountUpdate = z.infer<typeof accountUpdateSchema>;
export type AccountResponse = z.infer<typeof accountResponseSchema>;
