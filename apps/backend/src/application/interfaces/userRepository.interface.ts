import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';
import { User } from 'src/domain';
import { UserSnapshot } from 'src/domain/users';

export type UserRepositoryUpdateProfileInput = {
  email?: string;
  name?: string;
  updatedAt: IsoDatetimeString;
};

export type UserRepositoryUpdatePasswordInput = {
  password: string;
  updatedAt: IsoDatetimeString;
};

export type UserRepositoryInterface = {
  create(user: User): Promise<void>;
  getById(userId: UUID): Promise<UserSnapshot>;
  getByEmailWithPassword(email: string): Promise<User | undefined>;
  updateUserProfile(
    id: UUID,
    data: UserRepositoryUpdateProfileInput,
  ): Promise<void>;
  delete(id: UUID): Promise<void>;
  updateUserPassword(
    id: UUID,
    data: UserRepositoryUpdatePasswordInput,
  ): Promise<void>;
};
