import { UUID } from "./types";

export type UserResponseDTO = {
  email: string;
  id: UUID;
  name: string;
};

export type UserUpdateDTO = {
  email?: string;
  name?: string;
};

export type UserChangePasswordDTO = {
  currentPassword: string;
  newPassword: string;
};
