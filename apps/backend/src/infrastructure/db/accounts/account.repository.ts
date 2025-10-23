import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { AccountRepositoryInterface } from 'src/application/interfaces/AccountRepository.interface';
import { DataBase, TxType } from 'src/db';
import {
  AccountDbRow,
  AccountDbUpdate,
  AccountRepoInsert,
  accountsTable,
} from 'src/db/schemas/accounts';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';

import { BaseRepository } from '../BaseRepository';

export class AccountRepository
  extends BaseRepository
  implements AccountRepositoryInterface
{
  constructor(db: DataBase) {
    super(db);
  }

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

  getById(userId: UUID, id: UUID, tx?: TxType): Promise<AccountDbRow> {
    return this.executeDatabaseOperation<AccountDbRow>(async () => {
      const dbClient = tx ?? this.db;

      const account = await dbClient
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

      if (!account) {
        throw new NotFoundError(`Account with ID ${id} not found`);
      }

      return account;
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

        if (!updatedAccount) {
          throw new NotFoundError(`Account with ID ${id} not found`);
        }

        return updatedAccount;
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

      if (!updatedAccount) {
        throw new NotFoundError(`Account with ID ${id} not found`);
      }

      return updatedAccount;
    }, `Failed to delete account with ID ${id}`);
  }
}
