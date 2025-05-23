import { z } from "zod";

export type AccountType =
  | "cash"
  | "debit"
  | "credit"
  | "savings"
  | "investment";

import { accountCreateSchema, accountResponseSchema } from "../validation";

export type AccountCreateDTO = z.infer<typeof accountCreateSchema>;
export type AccountResponseDTO = z.infer<typeof accountResponseSchema>;
