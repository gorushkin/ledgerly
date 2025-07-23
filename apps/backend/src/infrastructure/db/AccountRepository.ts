import {
  AccountCreate,
  AccountResponse,
  AccountUpdate,
  UUID,
} from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { accounts } from 'src/db/schemas/accounts';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class AccountRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  // async getSuperAll() {
  //   return this.executeDatabaseOperation<AccountResponse[]>(
  //     () => this.db.select().from(accounts).all(),
  //     'Failed to fetch all accounts',
  //   );
  // }

  async getAll(userId: UUID): Promise<AccountResponse[]> {
    return this.executeDatabaseOperation<AccountResponse[]>(
      () =>
        this.db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, userId))
          .all(),
      'Failed to fetch accounts',
    );
  }

  create(data: AccountCreate): Promise<AccountResponse> {
    return this.executeDatabaseOperation(
      () => this.db.insert(accounts).values(data).returning().get(),
      'Failed to create account',
      {
        field: 'accountName',
        tableName: 'accounts',
        value: data.name,
      },
    );
  }

  getById(userId: UUID, id: UUID): Promise<AccountResponse | undefined> {
    return this.executeDatabaseOperation<AccountResponse | undefined>(
      () =>
        this.db
          .select()
          .from(accounts)
          .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
          .get(),
      'Failed to fetch account by ID',
    );
  }

  async update(
    userId: UUID,
    id: UUID,
    data: AccountUpdate,
  ): Promise<AccountResponse> {
    return this.executeDatabaseOperation(
      () =>
        this.db
          .update(accounts)
          .set(data)
          .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
          .returning()
          .get(),
      `Failed to update account with ID ${id}`,
      {
        field: 'accountName',
        tableName: 'accounts',
        value: data.name ?? 'No name provided',
      },
    );
  }

  async delete(userId: UUID, id: UUID): Promise<void> {
    return this.executeDatabaseOperation<void>(async () => {
      await this.db
        .delete(accounts)
        .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
        .run();
    }, `Failed to delete account with ID ${id}`);
  }
}
