import { z } from "zod";

import {
  operationResponseSchema,
  operationCreateSchema,
} from "../validation/operations";

export type OperationCreateDTO = z.infer<typeof operationCreateSchema>;

export type OperationResponseDTO = z.infer<typeof operationResponseSchema>;
