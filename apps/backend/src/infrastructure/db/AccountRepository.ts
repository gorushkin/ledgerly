import { Account, AccountDTO } from '@ledgerly/shared';
import { eq } from 'drizzle-orm';
import { accounts } from 'src/db/schema';
import { withErrorHandling } from 'src/libs/errorHandler';

import type { IAccountRepository } from '../../domain/IAccountRepository';

import { BaseRepository } from './BaseRepository';

class AccountRepository extends BaseRepository implements IAccountRepository {
  async createAccount(data: AccountDTO): Promise<Account> {
    return withErrorHandling(
      () => this.db.insert(accounts).values(data).returning().get(),
      'Failed to create account',
    );
  }

  async updateAccount(id: string, data: AccountDTO): Promise<Account> {
    return withErrorHandling(
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

  async deleteAccount(id: string): Promise<Account | undefined> {
    return withErrorHandling(
      () =>
        this.db.delete(accounts).where(eq(accounts.id, id)).returning().get(),
      `Failed to delete account with ID ${id}`,
    );
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    return withErrorHandling(
      () => this.db.select().from(accounts).where(eq(accounts.id, id)).get(),
      `Failed to fetch account with ID ${id}`,
    );
  }

  async getAllAccounts(): Promise<Account[]> {
    return withErrorHandling(
      () => this.db.select().from(accounts).all(),
      'Failed to fetch accounts',
    );
  }
}

export const accountRepository = new AccountRepository();
