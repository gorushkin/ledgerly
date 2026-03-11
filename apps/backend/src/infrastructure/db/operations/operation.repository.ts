import { UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { OperationRepositoryInterface } from 'src/application';
import {
  OperationDbInsert,
  OperationDbRow,
  operationsTable,
} from 'src/db/schema';
import { OperationSnapshot } from 'src/domain/operations/types';

import { BaseRepository } from '../BaseRepository';

export class OperationRepository
  extends BaseRepository
  implements OperationRepositoryInterface
{
  insert(
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

  update(userId: UUID, operations: OperationDbRow[]): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        for (const operation of operations) {
          await this.db
            .update(operationsTable)
            .set({ ...operation, ...this.updateTimestamp })
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

  softDelete(userId: UUID, operationIds: UUID[]): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        await this.db
          .update(operationsTable)
          .set({ isTombstone: true, ...this.updateTimestamp })
          .where(
            and(
              eq(operationsTable.userId, userId),
              inArray(operationsTable.id, operationIds),
            ),
          );
      },
      'OperationRepository.softDelete',
      {
        field: 'operationIds',
        tableName: 'operations',
        value: operationIds.join(', '),
      },
    );
  }

  async save(
    userId: UUID,
    operations: OperationDbRow[],
    snapshots: Map<UUID, OperationSnapshot>,
  ): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        const operationsToInsert: OperationDbRow[] = [];
        const operationsToUpdate: OperationDbRow[] = [];
        const operationsToDelete: UUID[] = [];

        operations.forEach((operation) => {
          const matchedOperationSnapshot = snapshots.get(operation.id);

          if (!matchedOperationSnapshot) {
            operationsToInsert.push(operation);
            return;
          }

          if (operation.isTombstone) {
            operationsToDelete.push(operation.id);
            return;
          }

          operationsToUpdate.push(operation);
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
}
