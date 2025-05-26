import { z } from "zod";

import { dateText, defaultText } from "./baseValidations";
import { operationCreateSchema } from "./operations";

export const transactionCreateSchema = z.object({
  description: defaultText,
  operations: z.array(operationCreateSchema).nonempty(),
  postingDate: dateText,
  transactionDate: dateText,
});
