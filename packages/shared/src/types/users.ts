import { z } from "zod";

import {
  usersResponseSchema,
  usersCreateSchema,
  usersUpdateSchema,
  passwordChangeSchema,
} from "../validation";

import { UUID } from "./auth";

export type UserBaseDTO = {
  email: string;
  id: UUID;
  name: string;
};

export type UserDbInsertDTO = Omit<UserBaseDTO, "id"> & {
  password: string;
};

export type UserDbRowDTO = UserBaseDTO;
export type UserDbUpdateDTO = Partial<UserBaseDTO>;

export type UsersCreate = z.infer<typeof usersCreateSchema>;
export type UsersResponse = z.infer<typeof usersResponseSchema>;
export type UsersUpdate = z.infer<typeof usersUpdateSchema>;
export type PasswordChange = z.infer<typeof passwordChangeSchema>;
