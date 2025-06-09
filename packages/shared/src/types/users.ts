import { z } from "zod";

import {
  usersResponseSchema,
  usersCreateSchema,
  usersUpdateSchema,
  passwordChangeSchema,
} from "../validation";

export type UsersCreate = z.infer<typeof usersCreateSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type UsersUpdate = z.infer<typeof usersUpdateSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
