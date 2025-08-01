import {
  TransactionDbRecordDTO,
  TransactionDbRowDTO,
  UUID,
} from '@ledgerly/shared/types';
import { eq, and } from 'drizzle-orm';
import { transactionsTable } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class TransactionRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async getAll(): Promise<TransactionDbRecordDTO[]> {
    return this.executeDatabaseOperation(async () => {
      return await this.db.select().from(transactionsTable).all();
    }, 'Failed to fetch transactions');
  }

  async getAllByUserId(userId: UUID): Promise<TransactionDbRecordDTO[]> {
    return this.executeDatabaseOperation(async () => {
      return await this.db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.userId, userId))
        .all();
    }, 'Failed to fetch transactions');
  }

  async getById(
    userId: UUID,
    id: UUID,
  ): Promise<TransactionDbRecordDTO | undefined> {
    return this.executeDatabaseOperation(async () => {
      return this.db
        .select()
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.id, id),
            eq(transactionsTable.userId, userId),
          ),
        )
        .get();
    }, 'Failed to fetch transaction');
  }

  async create(
    dto: TransactionDbRecordDTO,
    tx?: DataBase,
  ): Promise<TransactionDbRowDTO> {
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

  async delete(id: string): Promise<void> {
    return this.executeDatabaseOperation(async () => {
      await this.db
        .delete(transactionsTable)
        .where(eq(transactionsTable.id, id));
    }, 'Failed to delete transaction');
  }

  async update(
    userId: UUID,
    id: UUID,
    data: TransactionDbRecordDTO,
  ): Promise<TransactionDbRowDTO | undefined> {
    return this.executeDatabaseOperation(async () => {
      return await this.db
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
    }, 'Failed to update transaction');
  }
}
