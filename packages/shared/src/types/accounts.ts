import { accountCreateSchema, accountResponseSchema } from "../validation";
import { z } from "zod";

export type AccountCreateDTO = z.infer<typeof accountCreateSchema>;
export type AccountResponseDTO = z.infer<typeof accountResponseSchema>;
