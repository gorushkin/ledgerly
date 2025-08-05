import {
  OperationDBRowDTO,
  OperationInsertDTO,
  OperationResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { operationsTable } from 'src/db/schemas';
import { InvalidDataError } from 'src/presentation/errors';
import { DataBase } from 'src/types';

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
    tx?: DataBase,
  ): Promise<OperationDBRowDTO[]> {
    return this.executeDatabaseOperation(
      async () => {
        if (operations.length === 0) {
          throw new InvalidDataError('Нельзя создать транзакцию без операций');
        }

        const dbClient = tx ?? this.db;

        return dbClient.insert(operationsTable).values(operations).returning();
      },
      'Failed to bulk insert operations',
      { field: 'operations', tableName: 'operations' },
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
