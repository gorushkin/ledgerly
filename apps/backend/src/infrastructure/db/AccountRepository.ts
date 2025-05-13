import { eq } from 'drizzle-orm';
import { db } from 'src/db';
import { accounts } from 'src/db/schema';
import { withErrorHandling } from 'src/libs/errorHandler';

import {
  Account,
  AccountFormValues,
} from '../../../../../packages/shared/types/account';
import type { IAccountRepository } from '../../domain/IAccountRepository';

class AccountRepository implements IAccountRepository {
  async createAccount(data: AccountFormValues): Promise<Account> {
    return withErrorHandling(
      () => db.insert(accounts).values(data).returning().get(),
      'Failed to create account',
    );
  }

  async updateAccount(id: string, data: AccountFormValues): Promise<Account> {
    return withErrorHandling(
      () =>
        db
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
      () => db.delete(accounts).where(eq(accounts.id, id)).returning().get(),
      `Failed to delete account with ID ${id}`,
    );
  }

  async getAccountById(id: string): Promise<Account | undefined> {
    return withErrorHandling(
      () => db.select().from(accounts).where(eq(accounts.id, id)).get(),
      `Failed to fetch account with ID ${id}`,
    );
  }

  async getAllAccounts(): Promise<Account[]> {
    return withErrorHandling(
      () => db.select().from(accounts).all(),
      'Failed to fetch accounts',
    );
  }
}

export const accountRepository = new AccountRepository();
