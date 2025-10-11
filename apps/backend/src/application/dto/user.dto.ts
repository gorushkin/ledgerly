import { UUID } from '@ledgerly/shared/types';

// Request DTOs for creation
export type CreateUserRequestDTO = {
  name: string;
  email: string;
  password: string;
};

// Request DTOs for updating
export type UpdateUserRequestDTO = {
  name?: string;
  email?: string;
};

// Response DTOs
export type UserResponseDTO = {
  id: UUID;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
};

// Query DTOs
export type GetUserQueryDTO = {
  userId: UUID;
};
