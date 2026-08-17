import { UUID } from '@ledgerly/shared/types';
import { AccountQuery } from '@ledgerly/shared/validation';
import { and, eq, inArray, sql } from 'drizzle-orm';
import {
  type AccountLifecycleUpdateInput,
  type AccountRepositoryInterface,
  type AccountRepositoryLifecycleInput,
  type AccountRepositoryUpdateInput,
  type AccountLifecycleAction,
} from 'src/application';
import { accountsTable } from 'src/db/schemas';
import { AccountSnapshot } from 'src/domain/accounts';
import {
  AccountPersistenceConflictError,
  RepositoryInvariantError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';

import { BaseRepository } from '../BaseRepository';

import { AccountPersistenceMapper } from './account-persistence.mapper';

const getWhereClauseForGetAll = (userId: UUID, query: AccountQuery) => {
  const { status } = query;

  if (status === 'all') {
    return and(
      eq(accountsTable.userId, userId),
      eq(accountsTable.isTombstone, false),
    );
  }

  return and(
    eq(accountsTable.userId, userId),
    eq(accountsTable.isClosed, status !== 'open'),
    eq(accountsTable.isTombstone, false),
  );
};

const getWhereClauseForGetByIdInternal = (
  userId: UUID,
  id: UUID,
  options: { includeTombstone: boolean },
) => {
  if (options.includeTombstone) {
    return and(eq(accountsTable.id, id), eq(accountsTable.userId, userId));
  }

  return and(
    eq(accountsTable.id, id),
    eq(accountsTable.userId, userId),
    eq(accountsTable.isTombstone, false),
  );
};

const lifecycleMapper: Record<
  AccountLifecycleAction,
  { name: string; params: Record<string, boolean> }
> = {
  close: { name: 'close', params: { isClosed: true } },
  open: { name: 'open', params: { isClosed: false } },
};

export class AccountRepository
  extends BaseRepository
  implements AccountRepositoryInterface
{
  private accountNotFoundError(id: UUID): RepositoryNotFoundError {
    return new RepositoryNotFoundError(
      `Account with ID ${id} not found`,
      this.entityNotFoundContext('account', id),
    );
  }

  async getAll(userId: UUID, query: AccountQuery): Promise<AccountSnapshot[]> {
    return this.executeDatabaseOperation<AccountSnapshot[]>(async () => {
      const whereClause = getWhereClauseForGetAll(userId, query);

      const accounts = await this.db
        .select()
        .from(accountsTable)
        .where(whereClause)
        .all();

      return accounts.map((account) =>
        AccountPersistenceMapper.toSnapshot(account),
      );
    }, 'Failed to fetch accounts');
  }

  create(userId: UUID, data: AccountSnapshot): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        if (data.userId !== userId) {
          throw new RepositoryInvariantError(
            'Account snapshot userId must match repository create userId',
          );
        }

        const result = await this.db.insert(accountsTable).values({
          ...AccountPersistenceMapper.toDBRowFromSnapshot(data),
        });

        this.ensureRowsAffected(
          result.rowsAffected,
          new AccountPersistenceConflictError(
            `Failed to create account with ID ${data.id}`,
          ),
        );
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

  private getByIdInternal(
    userId: UUID,
    id: UUID,
    options: { includeTombstone: boolean },
  ): Promise<AccountSnapshot> {
    return this.executeDatabaseOperation<AccountSnapshot>(async () => {
      const whereClause = getWhereClauseForGetByIdInternal(userId, id, options);

      const account = await this.db
        .select()
        .from(accountsTable)
        .where(whereClause)
        .get();

      const existingAccount = this.ensureEntityExists(
        account,
        `Account with ID ${id} not found`,
        this.entityNotFoundContext('account', id),
      );

      return AccountPersistenceMapper.toSnapshot(existingAccount);
    }, 'Failed to fetch account by ID');
  }

  // TODO: it should be used for idempotent deleting
  getByIdForLifecycle(userId: UUID, id: UUID): Promise<AccountSnapshot> {
    return this.getByIdInternal(userId, id, { includeTombstone: true });
  }

  getById(userId: UUID, id: UUID): Promise<AccountSnapshot> {
    return this.getByIdInternal(userId, id, { includeTombstone: false });
  }

  async update(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryUpdateInput,
  ): Promise<void> {
    await this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(data, [
          'description',
          'name',
          'type',
          'updatedAt',
        ]);

        const result = await this.db
          .update(accountsTable)
          .set(safeData)
          .where(
            and(
              eq(accountsTable.id, id),
              eq(accountsTable.userId, userId),
              eq(accountsTable.isTombstone, false),
            ),
          );

        this.ensureRowsAffected(
          result.rowsAffected,
          this.accountNotFoundError(id),
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

  private async updateLifecycle(
    userId: UUID,
    id: UUID,
    data: AccountLifecycleUpdateInput,
  ): Promise<void> {
    const { action, updatedAt } = data;
    const { name, params } = lifecycleMapper[action];
    const targetIsClosed = params.isClosed;

    return this.executeDatabaseOperation<void>(async () => {
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

      if (existingAccount.isClosed === targetIsClosed) {
        return;
      }

      const result = await this.db
        .update(accountsTable)
        .set({ ...params, updatedAt })
        .where(
          and(
            eq(accountsTable.id, id),
            eq(accountsTable.userId, userId),
            eq(accountsTable.isTombstone, false),
          ),
        );

      this.ensureRowsAffected(
        result.rowsAffected,
        this.accountNotFoundError(id),
      );

      // No return value for lifecycle updates
    }, `Failed to ${name} account with ID ${id}`);
  }

  async open(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryLifecycleInput,
  ): Promise<void> {
    await this.updateLifecycle(userId, id, {
      action: 'open',
      updatedAt: data.updatedAt,
    });
  }

  async close(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryLifecycleInput,
  ): Promise<void> {
    await this.updateLifecycle(userId, id, {
      action: 'close',
      updatedAt: data.updatedAt,
    });
  }

  async delete(
    userId: UUID,
    id: UUID,
    data: AccountRepositoryLifecycleInput,
  ): Promise<void> {
    return this.executeDatabaseOperation<void>(async () => {
      const result = await this.db
        .update(accountsTable)
        .set({ isTombstone: true, updatedAt: data.updatedAt })
        .where(
          and(
            eq(accountsTable.id, id),
            eq(accountsTable.userId, userId),
            eq(accountsTable.isTombstone, false),
          ),
        );

      this.ensureRowsAffected(
        result.rowsAffected,
        this.accountNotFoundError(id),
      );
    }, `Failed to soft delete account with ID ${id}`);
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

      return AccountPersistenceMapper.toSnapshot(existingAccount);
    }, 'Failed to verify account ownership');
  }

  async existsActiveByCommodityId(
    userId: UUID,
    commodityId: UUID,
  ): Promise<boolean> {
    return this.executeDatabaseOperation(
      async () => {
        const count = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(accountsTable)
          .where(
            and(
              eq(accountsTable.userId, userId),
              eq(accountsTable.commodityId, commodityId),
              eq(accountsTable.isTombstone, false),
            ),
          )
          .get();

        return !!count && count.count > 0;
      },
      'AccountRepository.existsActiveByCommodityId',
      {
        field: 'commodityId',
        tableName: 'accounts',
        value: commodityId,
      },
    );
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

      return accounts.map((account) =>
        AccountPersistenceMapper.toSnapshot(account),
      );
    }, 'Failed to fetch accounts by IDs');
  }
}
