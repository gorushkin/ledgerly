import { UUID } from "./types";

export type UserResponseDTO = {
  email: string;
  id: UUID;
  name: string;
};

export type UserCreateDTO = {
  email: string;
  name: string;
  password: string;
};

export type UserUpdateDTO = Partial<UserResponseDTO>;

export type UserChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};
