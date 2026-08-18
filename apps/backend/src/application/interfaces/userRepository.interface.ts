import { UUID } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { UserSnapshot } from 'src/domain/users';

export type UserRepositoryUpdateProfileInput = Pick<UserSnapshot, 'updatedAt'> &
  Partial<Pick<UserSnapshot, 'name' | 'email'>>;

export type UserRepositoryInterface = {
  create(user: User): Promise<void>;
  getById(userId: UUID): Promise<UserSnapshot>;
  getByEmailWithPassword(email: string): Promise<User | undefined>;
  updateUserProfile(
    id: UUID,
    data: UserRepositoryUpdateProfileInput,
  ): Promise<UserSnapshot>;
  delete(id: UUID): Promise<void>;
  updateUserPassword(id: UUID, hashedPassword: string): Promise<void>;
};
