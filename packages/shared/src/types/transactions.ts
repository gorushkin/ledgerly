import { z } from "zod";

import {
  transactionCreateSchema,
  transactionResponseSchema,
} from "../validation";

export type TransactionCreateDTO = z.infer<typeof transactionCreateSchema>;

export type TransactionResponseDTO = z.infer<typeof transactionResponseSchema>;
