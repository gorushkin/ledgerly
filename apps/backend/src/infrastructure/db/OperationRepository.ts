import { UUID, PerIdStatus } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { OperationDbRow, OperationRepoInsert } from 'src/db/schema';
import { operationsTable } from 'src/db/schemas';
import { DataBase, TxType } from 'src/types';

import { BaseRepository } from './BaseRepository';

type BulkOutcome = Record<UUID, PerIdStatus>;

type BulkUpdateResult = {
  requestedIds: UUID[];
  outcome: BulkOutcome;
  changed: number;
  notFoundIds: UUID[];
};

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

  async bulkUpdateStatus(
    requestedIds: UUID[],
    isTombstone: boolean,
    tx?: DataBase,
  ): Promise<BulkUpdateResult> {
    if (requestedIds.length === 0) {
      return {
        changed: 0,
        notFoundIds: [],
        outcome: {},
        requestedIds: [],
      };
    }

    const messageMapper: Record<'true' | 'false', string> = {
      false: 'Failed to delete operation by transaction ID',
      true: 'Failed to restore operation by transaction ID',
    };

    const errorMessage =
      messageMapper[isTombstone.toString() as 'true' | 'false'];

    return this.executeDatabaseOperation(
      async () => {
        const dbClient = tx ?? this.db;

        const existingOperations = await dbClient
          .select({
            id: operationsTable.id,
            isTombstone: operationsTable.isTombstone,
          })
          .from(operationsTable)
          .where(and(inArray(operationsTable.id, requestedIds)));

        const knownIds = new Map<UUID, boolean>();
        const toUpdate: UUID[] = [];

        existingOperations.forEach((operationData) => {
          knownIds.set(operationData.id, operationData.isTombstone);

          if (operationData.isTombstone !== isTombstone) {
            toUpdate.push(operationData.id);
          }
        });

        const updatedOperations = await dbClient
          .update(operationsTable)
          .set({ isTombstone, ...this.updateTimestamp })
          .where(
            and(
              inArray(operationsTable.id, toUpdate),
              eq(operationsTable.isTombstone, !isTombstone),
            ),
          )
          .returning({ id: operationsTable.id });

        const updatedIds = new Set(updatedOperations.map((r) => r.id));

        const outcome: BulkOutcome = {};
        const notFoundIds: string[] = [];

        requestedIds.forEach((id) => {
          if (!knownIds.has(id)) {
            outcome[id] = 'not_found';
            notFoundIds.push(id);
            return;
          }

          if (updatedIds.has(id)) {
            return (outcome[id] = isTombstone ? 'deleted' : 'restored');
          }

          outcome[id] = isTombstone ? 'already_deleted' : 'already_alive';
        });

        return {
          changed: updatedOperations.length,
          notFoundIds,
          outcome,
          requestedIds,
        };
      },
      errorMessage,
      { field: 'transactionId', tableName: 'operations' },
    );
  }

  async bulkSoftDeleteByIds(operationsIds: UUID[], tx?: DataBase) {
    return this.bulkUpdateStatus(operationsIds, true, tx);
  }

  async bulkRestoreByIds(operationsIds: UUID[], tx?: DataBase) {
    return this.bulkUpdateStatus(operationsIds, false, tx);
  }
}
