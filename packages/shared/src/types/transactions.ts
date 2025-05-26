import { z } from "zod";

import { transactionCreateSchema } from "../validation";

export type TransactionCreateDTO = z.infer<typeof transactionCreateSchema>;
