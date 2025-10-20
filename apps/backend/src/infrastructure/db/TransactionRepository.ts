import { UUID } from '@ledgerly/shared/types';
import { eq, and, desc } from 'drizzle-orm';
import { TransactionRepositoryInterface } from 'src/application';
import {
  TransactionDbRow,
  TransactionDbUpdate,
  TransactionRepoInsert,
} from 'src/db/schema';
import { transactionsTable } from 'src/db/schemas';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { DataBase, TxType } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class TransactionRepository
  extends BaseRepository
  implements TransactionRepositoryInterface
{
  constructor(db: DataBase) {
    super(db);
  }

  async getAll(): Promise<TransactionDbRow[]> {
    return this.executeDatabaseOperation(async () => {
      return await this.db.select().from(transactionsTable).all();
    }, 'Failed to fetch transactions');
  }

  async getAllByUserId(
    userId: UUID,
    _opts: { limit?: number; cursor?: string; accountId?: UUID } = {},
  ): Promise<TransactionDbRow[]> {
    return this.executeDatabaseOperation(async () => {
      return await this.db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.userId, userId))
        .orderBy(desc(transactionsTable.createdAt))
        .all();
    }, 'Failed to fetch transactions');
  }

  async getById(userId: UUID, id: UUID): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(async () => {
      const transaction = await this.db
        .select()
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.id, id),
            eq(transactionsTable.userId, userId),
          ),
        )
        .get();

      if (!transaction) {
        throw new NotFoundError(`Transaction with ID ${id} not found`);
      }

      return transaction;
    }, 'Failed to fetch transaction');
  }

  async create(
    dto: TransactionRepoInsert,
    tx?: TxType,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(async () => {
      const dbClient = tx ?? this.db;

      return await dbClient
        .insert(transactionsTable)
        .values({
          ...dto,
          ...this.createTimestamps,
          ...this.uuid,
          userId: dto.userId,
        })
        .returning()
        .get();
    }, 'Failed to create transaction');
  }

  private async updateStatus(
    userId: UUID,
    id: UUID,
    isTombstone: boolean,
    tx?: TxType,
  ): Promise<boolean> {
    const errorMessages: Record<'true' | 'false', string> = {
      false: 'Failed to delete transaction',
      true: 'Failed to restore transaction',
    };

    return this.executeDatabaseOperation(
      async () => {
        const dbClient = tx ?? this.db;

        const res = await dbClient
          .update(transactionsTable)
          .set({ isTombstone, ...this.updateTimestamp })
          .where(
            and(
              eq(transactionsTable.id, id),
              eq(transactionsTable.userId, userId),
              eq(transactionsTable.isTombstone, !isTombstone),
            ),
          )
          .run();

        return res.rowsAffected > 0;
      },
      errorMessages[isTombstone.toString() as 'true' | 'false'],
    );
  }

  async delete(userId: UUID, id: UUID, tx?: TxType): Promise<boolean> {
    return this.updateStatus(userId, id, true, tx);
  }

  async restore(userId: UUID, id: UUID, tx?: TxType): Promise<boolean> {
    return this.updateStatus(userId, id, false, tx);
  }

  async update(
    userId: UUID,
    id: UUID,
    data: TransactionDbUpdate,
    tx?: TxType,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(async () => {
      const dbClient = tx ?? this.db;

      const updatedTransaction = await dbClient
        .update(transactionsTable)
        .set({
          ...this.updateTimestamp,
          description: data.description,
          postingDate: data.postingDate,
          transactionDate: data.transactionDate,
        })
        .where(
          and(
            eq(transactionsTable.id, id),
            eq(transactionsTable.userId, userId),
          ),
        )
        .returning()
        .get();

      if (!updatedTransaction) {
        throw new NotFoundError(`Transaction with ID ${id} not found`);
      }

      return updatedTransaction;
    }, 'Failed to update transaction');
  }
}
