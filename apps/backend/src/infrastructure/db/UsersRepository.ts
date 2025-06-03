import { UsersCreateDTO, UsersResponseDTO } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { users } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class UsersRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  getUsers(): Promise<UsersResponseDTO[]> {
    return this.withErrorHandling(
      () => this.db.select().from(users).all(),
      'Failed to fetch users',
    );
  }

  getUserById(id: string): Promise<UsersResponseDTO | undefined> {
    return this.withErrorHandling(
      () => this.db.select().from(users).where(eq(users.id, id)).get(),
      'Failed to fetch user',
    );
  }

  updateUser(id: string, data: UsersCreateDTO): Promise<UsersResponseDTO> {
    return this.withErrorHandling(
      () =>
        this.db
          .update(users)
          .set(data)
          .where(eq(users.id, id))
          .returning()
          .get(),
      `Failed to update user with ID ${id}`,
    );
  }

  createUser(data: UsersCreateDTO): Promise<UsersResponseDTO> {
    return this.withErrorHandling(
      () => this.db.insert(users).values(data).returning().get(),
      'Failed to create user',
    );
  }

  deleteUser(id: string): Promise<UsersResponseDTO | undefined> {
    return this.withErrorHandling(
      () => this.db.delete(users).where(eq(users.id, id)).returning().get(),
      'Failed to delete user',
    );
  }
}
