import { UUID } from '@ledgerly/shared/types';
import { DataBase } from 'src/db';
import { UserDbRow } from 'src/db/schema';

import {
  CreateUserRequestDTO,
  UpdateUserRequestDTO,
  UserResponseDTO,
} from '../dto';

export type UserRepositoryInterface = {
  create(userData: CreateUserRequestDTO): Promise<UserResponseDTO>;
  getByEmail(email: string): Promise<UserResponseDTO | undefined>;
  update(userId: UUID, userData: Partial<UserDbRow>): Promise<UserDbRow>;
  getById(userId: UUID, tx?: DataBase): Promise<UserResponseDTO>;
  getByIdWithPassword(userId: UUID): Promise<UserDbRow | undefined>;
  getByEmailWithPassword(email: string): Promise<UserDbRow | undefined>;
  updateUserProfile(
    id: UUID,
    data: UpdateUserRequestDTO,
  ): Promise<UserResponseDTO>;
  delete(id: UUID): Promise<void>;
  updateUserPassword(id: UUID, hashedPassword: string): Promise<void>;
};
