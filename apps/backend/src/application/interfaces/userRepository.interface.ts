import { UserResponseDTO, UserUpdateDTO, UUID } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { UserProfileSnapshot } from 'src/domain/users';

export type UserRepositoryInterface = {
  create(user: User): Promise<UserResponseDTO>;
  getByEmail(email: string): Promise<UserResponseDTO | undefined>;
  update(userId: UUID, userData: UserUpdateDTO): Promise<UserResponseDTO>;
  getById(userId: UUID): Promise<UserProfileSnapshot>;
  getByIdWithPassword(userId: UUID): Promise<User | undefined>;
  getByEmailWithPassword(email: string): Promise<User | undefined>;
  updateUserProfile(id: UUID, data: UserUpdateDTO): Promise<UserResponseDTO>;
  delete(id: UUID): Promise<void>;
  updateUserPassword(id: UUID, hashedPassword: string): Promise<void>;
};
