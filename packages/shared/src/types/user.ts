import { UUID } from "./types";

export type UserBaseDTO = {
  email: string;
  name: string;
};

export type UserDbInsertDTO = UserBaseDTO & {
  password: string;
};

export type UserDbRowDTO = UserBaseDTO & {
  id: UUID;
};
export type UserDbUpdateDTO = Partial<UserBaseDTO>;

export type UsersCreateDTO = UserBaseDTO & {
  password: string;
};

export type UsersResponseDTO = UserBaseDTO & {
  id: UUID;
};

export type UsersUpdateDTO = Partial<UserBaseDTO>;

export type UserChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};
