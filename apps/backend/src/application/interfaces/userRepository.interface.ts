import { UserResponseDTO, UserUpdateDTO, UUID } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { UserProfileSnapshot, UserSnapshot } from 'src/domain/users';

export type UserRepositoryUpdateProfileInput = Pick<UserSnapshot, 'updatedAt'> &
  Partial<Pick<UserSnapshot, 'name' | 'email'>>;

export type UserRepositoryInterface = {
  create(user: User): Promise<UserResponseDTO>;
  getByEmail(email: string): Promise<UserResponseDTO | undefined>;
  update(userId: UUID, userData: UserUpdateDTO): Promise<UserResponseDTO>;
  getProfileById(userId: UUID): Promise<UserProfileSnapshot>;
  getById(userId: UUID): Promise<UserProfileSnapshot | undefined>;
  getByIdWithPassword(userId: UUID): Promise<User | undefined>;
  getByEmailWithPassword(email: string): Promise<User | undefined>;
  updateUserProfile(
    id: UUID,
    data: UserRepositoryUpdateProfileInput,
  ): Promise<UserSnapshot>;
  delete(id: UUID): Promise<void>;
  updateUserPassword(id: UUID, hashedPassword: string): Promise<void>;
};
