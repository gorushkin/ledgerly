import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import {
  AccountMapper,
  type AccountRepositoryInterface,
  type AccountRepositorySoftDeleteInput,
  type AccountRepositoryUpdateInput,
} from 'src/application';
import { accountsTable } from 'src/db/schemas/accounts';
import { AccountSnapshot } from 'src/domain/accounts';

import { BaseRepository } from '../BaseRepository';

export class AccountRepository
  extends BaseRepository
  implements AccountRepositoryInterface
{
  async getAll(userId: UUID): Promise<AccountSnapshot[]> {
    return this.executeDatabaseOperation<AccountSnapshot[]>(async () => {
      const accounts = await this.db
        .select()
        .from(accountsTable)
        .where(
          and(
            eq(accountsTable.userId, userId),
            eq(accountsTable.isTombstone, false),
          ),
        )
        .all();

      return accounts.map((account) => AccountMapper.toSnapshot(account));
    }, 'Failed to fetch accounts');
  }

  create(data: AccountSnapshot): Promise<AccountSnapshot> {
    return this.executeDatabaseOperation(
      async () => {
        const account = await this.db
          .insert(accountsTable)
          .values({
            ...AccountMapper.toDBRowFromSnapshot(data),
            currentClearedBalanceLocal: data.currentClearedBalanceLocal ?? '0',
          })
          .returning()
          .get();

        return AccountMapper.toSnapshot(account);
      },
      'Failed to create account',
      {
        foreignKey: {
          field: 'userId',
          tableName: 'accounts',
          value: data.userId,
        },
        unique: {
          field: 'accountName',
          tableName: 'accounts',
          value: data.name,
        },
      },
    );
  }

  getById(userId: UUID, id: UUID): Promise<AccountSnapshot> {
    return this.executeDatabaseOperation<AccountSnapshot>(async () => {
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

      const existingAccount = this.ensureEntityExists(
        account,
        `Account with ID ${id} not found`,
        this.entityNotFoundContext('account', id),
      );

      return AccountMapper.toSnapshot(existingAccount);
    }, 'Failed to fetch account by ID');
  }

  async update(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryUpdateInput,
  ): Promise<AccountSnapshot> {
    return this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(data, [
          'description',
          'initialBalance',
          'name',
          'currency',
          'type',
          'updatedAt',
        ]);

        const updatedAccount = await this.db
          .update(accountsTable)
          .set(safeData)
          .where(
            and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)),
          )
          .returning()
          .get();

        const existingAccount = this.ensureEntityExists(
          updatedAccount,
          `Account with ID ${id} not found`,
          this.entityNotFoundContext('account', id),
        );

        return AccountMapper.toSnapshot(existingAccount);
      },
      `Failed to update account with ID ${id}`,
      {
        field: 'accountName',
        tableName: 'accounts',
        value: data.name ?? 'No name provided',
      },
    );
  }

  async delete(
    userId: UUID,
    id: UUID,
    data: AccountRepositorySoftDeleteInput,
  ): Promise<AccountSnapshot> {
    return this.executeDatabaseOperation<AccountSnapshot>(async () => {
      const deletedAccount = await this.db
        .update(accountsTable)
        .set({ isTombstone: true, updatedAt: data.updatedAt })
        .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
        .returning()
        .get();

      const existingAccount = this.ensureEntityExists(
        deletedAccount,
        `Account with ID ${id} not found`,
        this.entityNotFoundContext('account', id),
      );

      return AccountMapper.toSnapshot(existingAccount);
    }, `Failed to delete account with ID ${id}`);
  }

  async findSystemAccount(
    userId: UUID,
    currency: CurrencyCode,
  ): Promise<AccountSnapshot> {
    return this.executeDatabaseOperation<AccountSnapshot>(async () => {
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

      const existingAccount = this.ensureEntityExists(
        account,
        `System account not found for currency: ${currency}`,
        this.entityNotFoundContext('account'),
      );

      return AccountMapper.toSnapshot(existingAccount);
    }, 'Failed to fetch system account');
  }

  async ensureUserOwnsAccount(userId: UUID, accountId: UUID) {
    return this.executeDatabaseOperation<AccountSnapshot>(async () => {
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
        this.entityNotFoundContext('account', accountId),
      );
      this.ensureAccess(
        existingAccount.userId === userId,
        'You do not have permission to access this account',
        this.unauthorizedAccessContext('account', accountId),
      );

      return AccountMapper.toSnapshot(existingAccount);
    }, 'Failed to verify account ownership');
  }

  async getByIds(userId: UUID, accountIds: UUID[]): Promise<AccountSnapshot[]> {
    return this.executeDatabaseOperation<AccountSnapshot[]>(async () => {
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
        missingAccounts.length === 0 ? true : null,
        `Accounts not found: ${missingAccounts.join(', ')}`,
        this.entityNotFoundContext('account'),
      );

      return accounts.map((account) => AccountMapper.toSnapshot(account));
    }, 'Failed to fetch accounts by IDs');
  }
}
