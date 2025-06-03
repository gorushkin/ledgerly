import { z } from "zod";

import { usersResponseSchema, usersCreateSchema } from "../validation";

export type UsersCreateDTO = z.infer<typeof usersCreateSchema>;
export type UsersResponseDTO = z.infer<typeof usersResponseSchema>;
