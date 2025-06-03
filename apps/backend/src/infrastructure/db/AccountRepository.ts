import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { accounts } from 'src/db/schemas';
import { withErrorHandling } from 'src/libs/errorHandler';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class AccountRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async createAccount(data: AccountCreateDTO): Promise<AccountResponseDTO> {
    return this.withErrorHandling(
      () => this.db.insert(accounts).values(data).returning().get(),
      'Failed to create account',
    );
  }

  async updateAccount(
    id: string,
    data: AccountCreateDTO,
  ): Promise<AccountResponseDTO> {
    return this.withErrorHandling(
      () =>
        this.db
          .update(accounts)
          .set(data)
          .where(eq(accounts.id, id))
          .returning()
          .get(),
      `Failed to update account with ID ${id}`,
    );
  }

  async deleteAccount(id: string): Promise<AccountResponseDTO | undefined> {
    return this.withErrorHandling(
      () =>
        this.db.delete(accounts).where(eq(accounts.id, id)).returning().get(),
      `Failed to delete account with ID ${id}`,
    );
  }

  async getAccountById(id: string): Promise<AccountResponseDTO | undefined> {
    return this.withErrorHandling(
      () => this.db.select().from(accounts).where(eq(accounts.id, id)).get(),
      `Failed to fetch account with ID ${id}`,
    );
  }

  async getAllAccounts(): Promise<AccountResponseDTO[]> {
    return withErrorHandling(
      () => this.db.select().from(accounts).all(),
      'Failed to fetch accounts',
    );
  }
}
