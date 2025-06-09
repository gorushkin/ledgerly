import {
  UsersCreate,
  UsersResponse,
  UsersUpdate,
} from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { users } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

const userSelect = {
  email: users.email,
  id: users.id,
  name: users.name,
} as const;

const userWithPasswordSelect = {
  ...userSelect,
  password: users.password,
} as const;

export class UsersRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async findByEmail(email: string): Promise<UsersResponse | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select(userSelect)
          .from(users)
          .where(eq(users.email, email))
          .get(),
      `Failed to find user with email ${email}`,
    );
  }

  async getUserByEmailWithPassword(email: string) {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select(userWithPasswordSelect)
          .from(users)
          .where(eq(users.email, email))
          .get(),
      `Failed to find user with email ${email}`,
    );
  }

  async getUserById(id: string): Promise<UsersResponse | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.select(userSelect).from(users).where(eq(users.id, id)).get(),
      `Failed to fetch user with ID ${id}`,
    );
  }

  async getUserByIdWithPassword(id: string) {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select(userWithPasswordSelect)
          .from(users)
          .where(eq(users.id, id))
          .get(),
      `Failed to fetch user with password for ID ${id}`,
    );
  }

  async updateUserProfile(
    id: string,
    data: UsersUpdate,
  ): Promise<UsersResponse> {
    return this.executeDatabaseOperation(async () => {
      const updateData: Partial<typeof users.$inferInsert> = {};

      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          updateData[key as keyof typeof users.$inferInsert] = value;
        }
      });

      return this.db
        .update(users)
        .set(updateData)
        .where(eq(users.id, id))
        .returning(userSelect)
        .get();
    }, `Failed to update user profile with ID ${id}`);
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await this.executeDatabaseOperation(
      async () =>
        this.db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, id))
          .run(),
      `Failed to update password for user with ID ${id}`,
    );
  }

  async create(data: UsersCreate): Promise<UsersResponse> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.insert(users).values(data).returning(userSelect).get(),
      'Failed to create user',
    );
  }

  async deleteUser(id: string): Promise<UsersResponse | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .delete(users)
          .where(eq(users.id, id))
          .returning(userSelect)
          .get(),
      `Failed to delete user with ID ${id}`,
    );
  }

  // TODO: remove this method
  async getAll(): Promise<UsersResponse[]> {
    return this.executeDatabaseOperation(
      async () => this.db.select(userSelect).from(users).all(),
      'Failed to fetch all users',
    );
  }
}
