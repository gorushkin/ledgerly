import { UUID } from '@ledgerly/shared/types';
import { eq, and, desc } from 'drizzle-orm';
import { TransactionDbInsert, TransactionDbRow } from 'src/db/schema';
import { transactionsTable } from 'src/db/schemas';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { DataBase, TxType } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class TransactionRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  // getAll is for admin only
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
    dto: TransactionDbInsert,
    tx?: TxType,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(async () => {
      const dbClient = tx ?? this.db;

      return await dbClient
        .insert(transactionsTable)
        .values({
          ...dto,
          ...this.createTimestamps,
          userId: dto.userId,
        })
        .returning()
        .get();
    }, 'Failed to create transaction');
  }

  async delete(userId: UUID, id: string, tx?: TxType): Promise<void> {
    // TODO: add checking if user owns the transaction
    return this.executeDatabaseOperation(async () => {
      const dbClient = tx ?? this.db;

      const { rowsAffected } = await dbClient
        .delete(transactionsTable)
        .where(
          and(
            eq(transactionsTable.id, id),
            eq(transactionsTable.userId, userId),
          ),
        )
        .run();

      if (rowsAffected === 0) {
        throw new NotFoundError(`Transaction with id ${id} not found`);
      }
    }, 'Failed to delete transaction');
  }

  async update(
    userId: UUID,
    id: UUID,
    data: TransactionDbInsert,
    tx?: TxType,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(async () => {
      const dbClient = tx ?? this.db;

      const updatedTransaction = await dbClient
        .update(transactionsTable)
        .set({ ...data, ...this.updateTimestamp })
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
