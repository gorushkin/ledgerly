import {
  OperationDBRowDTO,
  OperationInsertDTO,
  OperationResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { eq, inArray } from 'drizzle-orm';
import { operationsTable } from 'src/db/schemas';
import { InvalidDataError } from 'src/presentation/errors';
import { DataBase, TxType } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class OperationRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async getByTransactionId(
    transactionId: string,
  ): Promise<OperationResponseDTO[]> {
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
    operations: OperationInsertDTO[],
    tx?: TxType,
  ): Promise<OperationDBRowDTO[]> {
    return this.executeDatabaseOperation(
      async () => {
        if (operations.length === 0) {
          throw new InvalidDataError(
            'Cannot create transaction without operations',
          );
        }

        const dbClient = tx ?? this.db;

        return dbClient.insert(operationsTable).values(operations).returning();
      },
      'Failed to bulk insert operations',
      { field: 'operations', tableName: 'operations' },
    );
  }

  async getByTransactionIds(
    transactionIds: UUID[],
  ): Promise<OperationResponseDTO[]> {
    // TODO: add tests for this method
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
