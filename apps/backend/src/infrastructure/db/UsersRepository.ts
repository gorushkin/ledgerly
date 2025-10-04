import {
  UserDbRowDTO,
  UsersCreateDTO,
  UsersResponseDTO,
  UsersUpdateDTO,
} from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { usersTable } from 'src/db/schemas';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

const userSelect = {
  email: usersTable.email,
  id: usersTable.id,
  name: usersTable.name,
} as const;

const userWithHashedPasswordSelect = {
  ...userSelect,
  hashedPassword: usersTable.password,
} as const;

export class UsersRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async findByEmail(email: string): Promise<UserDbRowDTO | undefined> {
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

  async getUserByEmailWithPassword(email: string) {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select(userWithHashedPasswordSelect)
          .from(usersTable)
          .where(eq(usersTable.email, email))
          .get(),
      `Failed to find user with email ${email}`,
    );
  }

  async getUserById(id: string, tx?: DataBase): Promise<UsersResponseDTO> {
    return this.executeDatabaseOperation(async () => {
      const dbToUse = tx ?? this.db;
      const user = await dbToUse
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

  async getUserByIdWithPassword(id: string) {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select(userWithHashedPasswordSelect)
          .from(usersTable)
          .where(eq(usersTable.id, id))
          .get(),
      `Failed to fetch user with password for ID ${id}`,
    );
  }

  async updateUserProfile(
    id: string,
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

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
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

  async create(data: UsersCreateDTO): Promise<UsersResponseDTO> {
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

  async deleteUser(id: string): Promise<void> {
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
