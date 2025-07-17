import { z } from "zod";

import {
  transactionCreateSchema,
  transactionResponseSchema,
} from "../validation";

export type TransactionCreate = z.infer<typeof transactionCreateSchema>;

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
