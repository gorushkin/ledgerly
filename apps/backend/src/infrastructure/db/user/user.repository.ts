import { UUID } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { UserRepositoryInterface } from 'src/application';
import type { UserRepositoryUpdateProfileInput } from 'src/application';
import { usersTable } from 'src/db/schemas';
import { User } from 'src/domain/users/';
import { UserSnapshot } from 'src/domain/users/';
import { RepositoryInvariantError } from 'src/infrastructure/errors';

import { BaseRepository } from '../BaseRepository';

import { UserPersistenceMapper } from './user-persistence.mapper';

export class UserRepository
  extends BaseRepository
  implements UserRepositoryInterface
{
  async getByEmailWithPassword(email: string): Promise<User | undefined> {
    return this.executeDatabaseOperation(async () => {
      const user = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, email))
        .get();

      return user ? UserPersistenceMapper.toDomain(user) : undefined;
    }, `Failed to find user with email ${email}`);
  }

  async getById(id: UUID): Promise<UserSnapshot> {
    return this.executeDatabaseOperation(async () => {
      const user = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .get();

      const existingUser = this.ensureEntityExists(
        user,
        `User with ID ${id} not found`,
        this.entityNotFoundContext('user', id),
      );

      return UserPersistenceMapper.toSnapshot(existingUser);
    }, `Failed to fetch user with ID ${id}`);
  }

  async updateUserProfile(
    id: UUID,
    data: UserRepositoryUpdateProfileInput,
  ): Promise<UserSnapshot> {
    const safeData = this.getSafeUpdate(data, ['email', 'name', 'updatedAt']);

    return this.executeDatabaseOperation(
      async () => {
        const updatedUserProfile = await this.db
          .update(usersTable)
          .set(safeData)
          .where(eq(usersTable.id, id))
          .returning()
          .get();

        this.ensureEntityExists(
          updatedUserProfile,
          `User with ID ${id} not found`,
          this.entityNotFoundContext('user', id),
        );

        return UserPersistenceMapper.toSnapshot(updatedUserProfile);
      },
      `Failed to update user profile with ID ${id}`,
      {
        unique: {
          field: 'email',
          tableName: 'users',
          value: safeData.email,
        },
      },
    );
  }

  async updateUserPassword(id: UUID, hashedPassword: string): Promise<void> {
    return this.executeDatabaseOperation(async () => {
      const { rowsAffected } = await this.db
        .update(usersTable)
        .set({ password: hashedPassword })
        .where(eq(usersTable.id, id))
        .run();

      this.ensureEntityExists(
        rowsAffected > 0 ? true : null,
        `User with ID ${id} not found`,
        this.entityNotFoundContext('user', id),
      );
    }, `Failed to update password for user with ID ${id}`);
  }

  async create(user: User): Promise<void> {
    const data = UserPersistenceMapper.toDBRow(user);

    return this.executeDatabaseOperation(
      async () =>
        this.ensureRowsAffected(
          (await this.db.insert(usersTable).values(data).run()).rowsAffected,
          new RepositoryInvariantError('Failed to create user'),
        ),
      'Failed to create user',
      {
        unique: {
          field: 'email',
          tableName: 'users',
          value: data.email,
        },
      },
    );
  }

  async delete(id: UUID): Promise<void> {
    return this.executeDatabaseOperation(async () => {
      const { rowsAffected } = await this.db
        .delete(usersTable)
        .where(eq(usersTable.id, id))
        .run();

      this.ensureEntityExists(
        rowsAffected > 0 ? true : null,
        `User with ID ${id} not found`,
        this.entityNotFoundContext('user', id),
      );
    }, `Failed to delete user with ID ${id}`);
  }
}
