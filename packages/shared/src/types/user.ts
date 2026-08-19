import { z } from "zod";

import { passwordChangeSchema, usersUpdateSchema } from "../validation";

import { UUID } from "./types";

export type UserResponseDTO = {
  email: string;
  id: UUID;
  name: string;
};

export type UserUpdateDTO = z.infer<typeof usersUpdateSchema>;

export type UserChangePasswordDTO = z.infer<typeof passwordChangeSchema>;
