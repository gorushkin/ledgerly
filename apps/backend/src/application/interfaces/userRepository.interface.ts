import { UUID } from '@ledgerly/shared/types';
import { DataBase } from 'src/db';
import { User } from 'src/domain/users/user.entity';

import { UpdateUserRequestDTO, UserResponseDTO } from '../dto';

export type UserRepositoryInterface = {
  create(user: User): Promise<UserResponseDTO>;
  getByEmail(email: string): Promise<UserResponseDTO | undefined>;
  update(
    userId: UUID,
    userData: UpdateUserRequestDTO,
  ): Promise<UserResponseDTO>;
  getById(userId: UUID, tx?: DataBase): Promise<UserResponseDTO>;
  getByIdWithPassword(userId: UUID): Promise<User | undefined>;
  getByEmailWithPassword(email: string): Promise<User | undefined>;
  updateUserProfile(
    id: UUID,
    data: UpdateUserRequestDTO,
  ): Promise<UserResponseDTO>;
  delete(id: UUID): Promise<void>;
  updateUserPassword(id: UUID, hashedPassword: string): Promise<void>;
};
