import {
  AccountInsertDTO,
  AccountDbRowDTO,
  AccountUpdateDbDTO,
  UUID,
} from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { accountsTable } from 'src/db/schemas/accounts';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class AccountRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async getAll(userId: UUID): Promise<AccountDbRowDTO[]> {
    return this.executeDatabaseOperation<AccountDbRowDTO[]>(
      () =>
        this.db
          .select()
          .from(accountsTable)
          .where(eq(accountsTable.userId, userId))
          .all(),
      'Failed to fetch accounts',
    );
  }

  create(data: AccountInsertDTO): Promise<AccountDbRowDTO> {
    return this.executeDatabaseOperation(
      () =>
        this.db
          .insert(accountsTable)
          .values({
            ...data,
            ...this.createTimestamps,
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

  getById(userId: UUID, id: UUID): Promise<AccountDbRowDTO | void> {
    return this.executeDatabaseOperation<AccountDbRowDTO | void>(async () => {
      const account = await this.db
        .select()
        .from(accountsTable)
        .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
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
    data: AccountUpdateDbDTO,
  ): Promise<AccountDbRowDTO | void> {
    return this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(data, [
          'initialBalance',
          'name',
          'originalCurrency',
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

  async delete(userId: UUID, id: UUID): Promise<void> {
    return this.executeDatabaseOperation<void>(async () => {
      const { rowsAffected } = await this.db
        .delete(accountsTable)
        .where(and(eq(accountsTable.id, id), eq(accountsTable.userId, userId)))
        .run();

      if (!rowsAffected) {
        throw new NotFoundError(`Account with ID ${id} not found`);
      }
    }, `Failed to delete account with ID ${id}`);
  }
}
