import { UserResponseDTO, UUID } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { UserRepositoryInterface } from 'src/application';
import type { UserRepositoryUpdateProfileInput } from 'src/application';
import { usersTable } from 'src/db/schemas';
import { User } from 'src/domain/users/';
import { UserProfileSnapshot, UserSnapshot } from 'src/domain/users/types';

import { BaseRepository } from '../BaseRepository';

import { UserPersistenceMapper } from './user-persistence.mapper';

const userSelect = {
  email: usersTable.email,
  id: usersTable.id,
  name: usersTable.name,
} as const;

export class UserRepository
  extends BaseRepository
  implements UserRepositoryInterface
{
  async getByEmail(email: string): Promise<UserResponseDTO | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select(userSelect)
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .get(),
      `Failed to find user with email ${email}`,
    );
  }

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

  async getProfileById(id: UUID): Promise<UserProfileSnapshot> {
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

      return UserPersistenceMapper.toProfileSnapshot(existingUser);
    }, `Failed to fetch user with ID ${id}`);
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

  async getByIdWithPassword(id: UUID): Promise<User | undefined> {
    return this.executeDatabaseOperation(async () => {
      const user = await this.db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .get();

      return user ? UserPersistenceMapper.toDomain(user) : undefined;
    }, `Failed to fetch user with password for ID ${id}`);
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

  async create(user: User): Promise<UserResponseDTO> {
    const data = UserPersistenceMapper.toDBRow(user);

    return this.executeDatabaseOperation(
      async () =>
        this.db.insert(usersTable).values(data).returning(userSelect).get(),
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

  // TODO: remove this method
  async getAll(): Promise<UserResponseDTO[]> {
    return this.executeDatabaseOperation(
      async () => this.db.select(userSelect).from(usersTable).all(),
      'Failed to fetch all users',
    );
  }
}
