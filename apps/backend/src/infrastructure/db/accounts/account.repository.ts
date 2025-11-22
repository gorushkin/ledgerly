import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { AccountRepositoryInterface } from 'src/application/interfaces/AccountRepository.interface';
import {
  AccountDbRow,
  AccountDbUpdate,
  AccountRepoInsert,
  accountsTable,
} from 'src/db/schemas/accounts';

import { BaseRepository } from '../BaseRepository';

export class AccountRepository
  extends BaseRepository
  implements AccountRepositoryInterface
{
  async getAll(userId: UUID): Promise<AccountDbRow[]> {
    return this.executeDatabaseOperation<AccountDbRow[]>(
      () =>
        this.db
          .select()
          .from(accountsTable)
          .where(
            and(
              eq(accountsTable.userId, userId),
              eq(accountsTable.isTombstone, false),
            ),
          )
          .all(),
      'Failed to fetch accounts',
    );
  }

  create(data: AccountRepoInsert): Promise<AccountDbRow> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .insert(accountsTable)
          .values({
            ...data,
            currentClearedBalanceLocal: data.currentClearedBalanceLocal ?? 0,
          })
          .returning()
          .get(),
      'Failed to create account',
      {
        field: 'accountName',
        tableName: 'accounts',
        value: data.name,
      },
    );
  }

  getById(userId: UUID, id: UUID): Promise<AccountDbRow> {
    return this.executeDatabaseOperation<AccountDbRow>(async () => {
      const account = await this.db
        .select()
        .from(accountsTable)
        .where(
          and(
            eq(accountsTable.id, id),
            eq(accountsTable.userId, userId),
            eq(accountsTable.isTombstone, false),
          ),
        )
        .get();

      return this.ensureEntityExists(
        account,
        `Account with ID ${id} not found`,
      );
    }, 'Failed to fetch account by ID');
  }

  async update(
    userId: UUID,
    id: UUID,
    data: AccountDbUpdate,
  ): Promise<AccountDbRow> {
    return this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(data, [
          'initialBalance',
          'name',
          'currency',
          'type',
        ]);

        const updatedAccount = await this.db
          .update(accountsTable)
          .set({ ...safeData, ...this.updateTimestamp })
          .where(
            and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)),
          )
          .returning()
          .get();

        return this.ensureEntityExists(
          updatedAccount,
          `Account with ID ${id} not found`,
        );
      },
      `Failed to update account with ID ${id}`,
      {
        field: 'accountName',
        tableName: 'accounts',
        value: data.name ?? 'No name provided',
      },
    );
  }

  async delete(userId: UUID, id: UUID): Promise<AccountDbRow> {
    return this.executeDatabaseOperation<AccountDbRow>(async () => {
      const updatedAccount = await this.db
        .update(accountsTable)
        .set({ isTombstone: true })
        .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
        .returning()
        .get();

      return this.ensureEntityExists(
        updatedAccount,
        `Account with ID ${id} not found`,
      );
    }, `Failed to delete account with ID ${id}`);
  }

  async findSystemAccount(
    userId: UUID,
    currency: CurrencyCode,
  ): Promise<AccountDbRow> {
    return this.executeDatabaseOperation<AccountDbRow>(async () => {
      const account = await this.db
        .select()
        .from(accountsTable)
        .where(
          and(
            eq(accountsTable.userId, userId),
            eq(accountsTable.currency, currency),
            eq(accountsTable.isSystem, true),
            eq(accountsTable.isTombstone, false),
          ),
        )
        .get();

      return this.ensureEntityExists(
        account,
        `System account not found for currency: ${currency}`,
      );
    }, 'Failed to fetch system account');
  }

  async ensureUserOwnsAccount(userId: UUID, accountId: UUID) {
    return this.executeDatabaseOperation<AccountDbRow>(async () => {
      const account = await this.db
        .select()
        .from(accountsTable)
        .where(
          and(
            eq(accountsTable.id, accountId),
            eq(accountsTable.isTombstone, false),
          ),
        )
        .get();

      const existingAccount = this.ensureEntityExists(
        account,
        `Account with ID ${accountId} not found`,
      );
      this.ensureAccess(
        existingAccount.userId === userId,
        'You do not have permission to access this account',
      );

      return existingAccount;
    }, 'Failed to verify account ownership');
  }

  async getByIds(userId: UUID, accountIds: UUID[]): Promise<AccountDbRow[]> {
    return this.executeDatabaseOperation<AccountDbRow[]>(async () => {
      const accounts = await this.db
        .select()
        .from(accountsTable)
        .where(
          and(
            inArray(accountsTable.id, accountIds),
            eq(accountsTable.userId, userId),
            eq(accountsTable.isTombstone, false),
          ),
        )
        .all();

      // Validate that all requested accounts were found
      const foundIds = new Set(accounts.map((acc) => acc.id));
      const missingAccounts = accountIds.filter((id) => !foundIds.has(id));

      this.ensureEntityExists(
        missingAccounts.length === 0 ? accounts : null,
        `Accounts not found: ${missingAccounts.join(', ')}`,
      );

      return accounts;
    }, 'Failed to fetch accounts by IDs');
  }
}
