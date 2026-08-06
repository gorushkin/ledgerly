import { UUID } from '@ledgerly/shared/types';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { OperationRepositoryInterface } from 'src/application';
import {
  OperationDbInsert,
  OperationDbRow,
  operationsTable,
} from 'src/db/schema';
import { OperationSnapshot } from 'src/domain/operations/types';
import { RepositoryInvariantError } from 'src/infrastructure/errors';

import { BaseRepository } from '../BaseRepository';

import { OperationPersistenceMapper } from './operation-persistence.mapper';

const SOFT_DELETE_BATCH_SIZE = 200;

export class OperationRepository
  extends BaseRepository
  implements OperationRepositoryInterface
{
  private insert(
    userId: UUID,
    operations: OperationDbInsert[],
  ): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        const operationsWithUser = operations.map((op) => ({
          ...op,
          userId,
        }));

        return this.db
          .insert(operationsTable)
          .values(operationsWithUser)
          .returning()
          .all();
      },
      'OperationRepository.insert',
      {
        field: 'operationIds',
        tableName: 'operations',
        value: operations.map((op) => op.id).join(', '),
      },
    );
  }

  private update(userId: UUID, operations: OperationDbInsert[]): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        for (const operation of operations) {
          const safeData = this.getSafeUpdate(operation, [
            'accountId',
            'amount',
            'description',
            'isTombstone',
            'value',
            'updatedAt',
          ]);

          await this.db
            .update(operationsTable)
            .set(safeData)
            .where(
              and(
                eq(operationsTable.id, operation.id),
                eq(operationsTable.userId, userId),
              ),
            );
        }
      },
      'OperationRepository.update',
      {
        field: 'operationIds',
        tableName: 'operations',
        value: operations.map((op) => op.id).join(', '),
      },
    );
  }

  private softDelete(
    userId: UUID,
    operations: OperationDbInsert[],
  ): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        if (operations.length === 0) {
          return;
        }

        for (
          let offset = 0;
          offset < operations.length;
          offset += SOFT_DELETE_BATCH_SIZE
        ) {
          const batch = operations.slice(
            offset,
            offset + SOFT_DELETE_BATCH_SIZE,
          );
          const operationIds = batch.map((operation) => operation.id);
          const updatedAtCase = sql.join(
            [
              sql`case ${operationsTable.id}`,
              ...batch.map(
                (operation) =>
                  sql`when ${operation.id} then ${operation.updatedAt}`,
              ),
              sql`else ${operationsTable.updatedAt} end`,
            ],
            sql.raw(' '),
          );

          await this.db
            .update(operationsTable)
            .set({ isTombstone: true, updatedAt: updatedAtCase })
            .where(
              and(
                eq(operationsTable.userId, userId),
                inArray(operationsTable.id, operationIds),
              ),
            );
        }
      },
      'OperationRepository.softDelete',
      {
        field: 'operationIds',
        tableName: 'operations',
        value: operations.map((op) => op.id).join(', '),
      },
    );
  }

  async save(
    userId: UUID,
    operations: OperationSnapshot[],
    snapshots?: Map<UUID, OperationSnapshot>,
  ): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        const operationsToInsert: OperationDbInsert[] = [];
        const operationsToUpdate: OperationDbInsert[] = [];
        const operationsToDelete: OperationDbInsert[] = [];

        operations.forEach((operation) => {
          const matchedOperationSnapshot = snapshots?.get(operation.id);

          if (!matchedOperationSnapshot) {
            operationsToInsert.push(
              OperationPersistenceMapper.toDBRowFromSnapshot(operation),
            );
            return;
          }

          if (matchedOperationSnapshot.isTombstone) {
            throw new RepositoryInvariantError(
              `Operation ${operation.id} is already tombstone in persistence snapshot`,
            );
          }

          if (operation.isTombstone) {
            operationsToDelete.push(
              OperationPersistenceMapper.toDBRowFromSnapshot(operation),
            );
            return;
          }

          operationsToUpdate.push(
            OperationPersistenceMapper.toDBRowFromSnapshot(operation),
          );
        });

        if (operationsToInsert.length > 0) {
          await this.insert(userId, operationsToInsert);
        }

        if (operationsToUpdate.length > 0) {
          await this.update(userId, operationsToUpdate);
        }

        if (operationsToDelete.length > 0) {
          await this.softDelete(userId, operationsToDelete);
        }
      },
      'OperationRepository.save',
      {
        field: 'operationIds',
        tableName: 'operations',
        value: '',
      },
    );
  }

  async existsActiveByAccountId(
    userId: UUID,
    accountId: UUID,
  ): Promise<boolean> {
    return this.executeDatabaseOperation(
      async () => {
        const count = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(operationsTable)
          .where(
            and(
              eq(operationsTable.userId, userId),
              eq(operationsTable.accountId, accountId),
              eq(operationsTable.isTombstone, false),
            ),
          )
          .get();

        return !!count && count.count > 0;
      },
      'OperationRepository.existsActiveByAccountId',
      {
        field: 'accountId',
        tableName: 'operations',
        value: accountId,
      },
    );
  }
}
