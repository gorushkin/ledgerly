import { UsersCreateDTO, UsersResponseDTO } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { users } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class UsersRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async findByEmail(email: string): Promise<UsersResponseDTO | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.select().from(users).where(eq(users.email, email)).get(),
      `Failed to find user with email ${email}`,
    );
  }

  async getUsers(): Promise<UsersResponseDTO[]> {
    return this.executeDatabaseOperation(
      async () => this.db.select().from(users).all(),
      'Failed to fetch users',
    );
  }

  async getUserById(id: string): Promise<UsersResponseDTO | undefined> {
    return this.executeDatabaseOperation(
      async () => this.db.select().from(users).where(eq(users.id, id)).get(),
      `Failed to fetch user with ID ${id}`,
    );
  }

  async updateUser(
    id: string,
    data: UsersCreateDTO,
  ): Promise<UsersResponseDTO> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning()
          .get(),
      `Failed to update user with ID ${id}`,
    );
  }

  async create(data: UsersCreateDTO): Promise<UsersResponseDTO> {
    return this.executeDatabaseOperation(
      async () => this.db.insert(users).values(data).returning().get(),
      'Failed to create user',
    );
  }

  async deleteUser(id: string): Promise<UsersResponseDTO | undefined> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.delete(users).where(eq(users.id, id)).returning().get(),
      `Failed to delete user with ID ${id}`,
    );
  }
}
