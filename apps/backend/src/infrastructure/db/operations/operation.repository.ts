import { UUID } from '@ledgerly/shared/types';
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
  // create(operation: OperationDbInsert): Promise<OperationDbRow> {
  //   return this.executeDatabaseOperation(
  //     async () =>
  //       this.db.insert(operationsTable).values(operation).returning().get(),
  //     'OperationRepository.create',
  //     { field: 'operation', tableName: 'operations', value: operation.id },
  //   );
  // }

  // getByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]> {
  //   return this.executeDatabaseOperation(
  //     async () => {
  //       const result = await this.db
  //         .select()
  //         .from(operationsTable)
  //         .where(
  //           and(
  //             eq(operationsTable.entryId, entryId),
  //             eq(operationsTable.userId, userId),
  //           ),
  //         )
  //         .all();

  //       return result;
  //     },
  //     'OperationRepository.getByEntryId',
  //     { field: 'entryId', tableName: 'operations', value: entryId },
  //   );
  // }

  // async voidByEntryIds(
  //   userId: UUID,
  //   entryIds: UUID[],
  // ): Promise<OperationDbRow[]> {
  //   return this.executeDatabaseOperation<OperationDbRow[]>(
  //     () => {
  //       return this.db
  //         .update(operationsTable)
  //         .set({ isTombstone: true, ...this.updateTimestamp })
  //         .where(
  //           and(
  //             inArray(operationsTable.entryId, entryIds),
  //             eq(operationsTable.userId, userId),
  //           ),
  //         )
  //         .returning()
  //         .all();
  //     },
  //     'OperationRepository.softDeleteByEntryIds',
  //     {
  //       field: 'entryId',
  //       tableName: 'operations',
  //       value: entryIds.join(', '),
  //     },
  //   );
  // }

  // voidByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]> {
  //   return this.executeDatabaseOperation<OperationDbRow[]>(
  //     () => {
  //       return this.db
  //         .update(operationsTable)
  //         .set({ isTombstone: true, ...this.updateTimestamp })
  //         .where(
  //           and(
  //             eq(operationsTable.entryId, entryId),
  //             eq(operationsTable.userId, userId),
  //           ),
  //         )
  //         .returning()
  //         .all();
  //     },
  //     'OperationRepository.voidByEntryId',
  //     { field: 'entryId', tableName: 'operations', value: entryId },
  //   );
  // }

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

        await this.insert(userId, operationsToInsert);
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
