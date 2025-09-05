import { UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import {
  OperationDbRow,
  OperationDbUpdate,
  OperationRepoInsert,
} from 'src/db/schema';
import { operationsTable } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class OperationRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async listByTransactionId(
    userId: UUID,
    transactionId: UUID,
  ): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        return this.db
          .select()
          .from(operationsTable)
          .where(
            and(
              eq(operationsTable.userId, userId),
              eq(operationsTable.transactionId, transactionId),
            ),
          )
          .all();
      },
      'Failed to fetch operations by transaction ID',
      { field: 'transactionId', tableName: 'operations' },
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

  async create(userId: UUID, operation: OperationRepoInsert, tx?: DataBase) {
    return this.executeDatabaseOperation(
      async () => {
        const dbClient = tx ?? this.db;

        const operationData = {
          ...operation,
          ...this.createTimestamps,
          ...this.uuid,
          userId,
        };

        const createdOperation = await dbClient
          .insert(operationsTable)
          .values(operationData)
          .returning()
          .get();

        return createdOperation;
      },
      'Failed to create operation',
      { field: 'operation', tableName: 'operations' },
    );
  }

  async update(
    userId: UUID,
    operationId: UUID,
    patch: OperationDbUpdate,
    tx?: DataBase,
  ) {
    return this.executeDatabaseOperation(
      async () => {
        const dbClient = tx ?? this.db;

        const updatedOperation = await dbClient
          .update(operationsTable)
          .set({
            accountId: patch.accountId,
            baseAmount: patch.baseAmount,
            description: patch.description,
            localAmount: patch.localAmount,
            rateBasePerLocal: patch.rateBasePerLocal,
            ...this.updateTimestamp,
          })
          .where(
            and(
              eq(operationsTable.id, operationId),
              eq(operationsTable.userId, userId),
            ),
          )
          .returning()
          .get();

        return updatedOperation;
      },
      'Failed to bulk update operations',
      { field: 'operationIds', tableName: 'operations' },
    );
  }

  async updateStatus(
    userId: UUID,
    id: UUID,
    isTombstone: boolean,
    tx?: DataBase,
  ): Promise<boolean> {
    const errorMessages: Record<'true' | 'false', string> = {
      false: 'Failed to delete operation',
      true: 'Failed to restore operation',
    };

    return this.executeDatabaseOperation(
      async (): Promise<boolean> => {
        const dbClient = tx ?? this.db;

        const res = await dbClient
          .update(operationsTable)
          .set({ isTombstone, ...this.updateTimestamp })
          .where(
            and(
              eq(operationsTable.id, id),
              eq(operationsTable.userId, userId),
              eq(operationsTable.isTombstone, !isTombstone),
            ),
          )
          .run();

        return res.rowsAffected > 0;
      },
      errorMessages[isTombstone.toString() as 'true' | 'false'],
      { field: 'operationId', tableName: 'operations' },
    );
  }

  async delete(
    userId: UUID,
    operationId: UUID,
    tx?: DataBase,
  ): Promise<boolean> {
    return this.updateStatus(userId, operationId, true, tx);
  }

  async restore(
    userId: UUID,
    operationId: UUID,
    tx?: DataBase,
  ): Promise<boolean> {
    return this.updateStatus(userId, operationId, false, tx);
  }
}
