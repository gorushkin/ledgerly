import { UsersResponseDTO, UsersUpdateDTO, UUID } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import {
  CreateUserRequestDTO,
  UserRepositoryInterface,
  UserResponseDTO,
} from 'src/application';
import { UserDbRow } from 'src/db/schema';
import { usersTable } from 'src/db/schemas';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';

import { BaseRepository } from './BaseRepository';

const userSelect = {
  email: usersTable.email,
  id: usersTable.id,
  name: usersTable.name,
} as const;

export class UserRepository
  extends BaseRepository
  implements UserRepositoryInterface
{
  update(_userId: UUID, _userData: Partial<UserDbRow>): Promise<UserDbRow> {
    throw new Error('Method not implemented.');
  }

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

  async getByEmailWithPassword(email: string): Promise<UserDbRow | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select()
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .get(),
      `Failed to find user with email ${email}`,
    );
  }

  async getById(id: UUID): Promise<UserResponseDTO> {
    return this.executeDatabaseOperation(async () => {
      const user = await this.db
        .select(userSelect)
        .from(usersTable)
        .where(eq(usersTable.id, id))
        .get();

      if (!user) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      return user;
    }, `Failed to fetch user with ID ${id}`);
  }

  async getByIdWithPassword(id: UUID): Promise<UserDbRow | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.select().from(usersTable).where(eq(usersTable.id, id)).get(),
      `Failed to fetch user with password for ID ${id}`,
    );
  }

  async updateUserProfile(
    id: UUID,
    data: UsersUpdateDTO,
  ): Promise<UsersResponseDTO> {
    return this.executeDatabaseOperation(async () => {
      const updateData: Partial<typeof usersTable.$inferInsert> = {};

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          // TODO: fix
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          updateData[key as keyof typeof usersTable.$inferInsert] = value;
        }
      });

      const updatedUserProfile = await this.db
        .update(usersTable)
        .set(updateData)
        .where(eq(usersTable.id, id))
        .returning(userSelect)
        .get();

      if (!updatedUserProfile) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }

      return updatedUserProfile;
    }, `Failed to update user profile with ID ${id}`);
  }

  async updateUserPassword(id: UUID, hashedPassword: string): Promise<void> {
    await this.executeDatabaseOperation(async () => {
      const { rowsAffected } = await this.db
        .update(usersTable)
        .set({ password: hashedPassword })
        .where(eq(usersTable.id, id))
        .run();

      if (rowsAffected === 0) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
    }, `Failed to update password for user with ID ${id}`);
  }

  async create(data: CreateUserRequestDTO): Promise<UserResponseDTO> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .insert(usersTable)
          .values({ ...data, ...this.uuid, ...this.createTimestamps })
          .returning(userSelect)
          .get(),
      'Failed to create user',
    );
  }

  async delete(id: UUID): Promise<void> {
    return this.executeDatabaseOperation(async () => {
      const { rowsAffected } = await this.db
        .delete(usersTable)
        .where(eq(usersTable.id, id))
        .run();

      if (rowsAffected === 0) {
        throw new NotFoundError(`User with ID ${id} not found`);
      }
    }, `Failed to delete user with ID ${id}`);
  }

  // TODO: remove this method
  async getAll(): Promise<UsersResponseDTO[]> {
    return this.executeDatabaseOperation(
      async () => this.db.select(userSelect).from(usersTable).all(),
      'Failed to fetch all users',
    );
  }
}
