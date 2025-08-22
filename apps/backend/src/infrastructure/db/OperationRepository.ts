import { UUID } from '@ledgerly/shared/types';
import { eq, inArray } from 'drizzle-orm';
import { OperationDbRow, OperationRepoInsert } from 'src/db/schema';
import { operationsTable } from 'src/db/schemas';
import { DataBase, TxType } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class OperationRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async getByTransactionId(transactionId: string): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        return this.db
          .select()
          .from(operationsTable)
          .where(eq(operationsTable.transactionId, transactionId))
          .all();
      },
      'Failed to fetch operations by transaction ID',
      { field: 'transactionId', tableName: 'operations' },
    );
  }

  async bulkInsert(
    operations: OperationRepoInsert[],
    tx?: TxType,
  ): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        if (!operations || operations.length === 0) {
          return [];
        }

        const dbClient = tx ?? this.db;

        const filledOperations = operations.map((op) => ({
          ...op,
          ...this.createTimestamps,
          ...this.uuid,
        }));

        return dbClient
          .insert(operationsTable)
          .values(filledOperations)
          .returning();
      },
      'Failed to bulk insert operations',
      { field: 'operations', tableName: 'operations' },
    );
  }

  async getByTransactionIds(transactionIds: UUID[]): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        if (transactionIds.length === 0) return [];

        const operations = await this.db
          .select()
          .from(operationsTable)
          .where(inArray(operationsTable.transactionId, transactionIds))
          .all();

        return operations;
      },
      'Failed to fetch operations by transaction IDs',
      { field: 'transactionIds', tableName: 'operations' },
    );
  }

  async deleteByTransactionId(
    transactionId: UUID,
    tx?: DataBase,
  ): Promise<number | void> {
    return this.executeDatabaseOperation(
      async () => {
        const dbClient = tx ?? this.db;

        const res = await dbClient
          .delete(operationsTable)
          .where(eq(operationsTable.transactionId, transactionId))
          .execute();

        return res.rowsAffected;
      },
      'Failed to delete operations by transaction ID',
      { field: 'transactionId', tableName: 'operations' },
    );
  }
}
