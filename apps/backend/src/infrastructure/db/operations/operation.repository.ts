import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { OperationRepositoryInterface } from 'src/application';
import {
  OperationDbInsert,
  OperationDbRow,
  operationsTable,
} from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

export class OperationRepository
  extends BaseRepository
  implements OperationRepositoryInterface
{
  create(operation: OperationDbInsert): Promise<OperationDbRow> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.insert(operationsTable).values(operation).returning().get(),
      'OperationRepository.create',
      { field: 'operation', tableName: 'operations', value: operation.id },
    );
  }

  getByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        const result = await this.db
          .select()
          .from(operationsTable)
          .where(
            and(
              eq(operationsTable.entryId, entryId),
              eq(operationsTable.userId, userId),
            ),
          )
          .all();

        return result;
      },
      'OperationRepository.getByEntryId',
      { field: 'entryId', tableName: 'operations', value: entryId },
    );
  }

  async softDeleteByEntryId(
    userId: UUID,
    entryId: UUID,
  ): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation<OperationDbRow[]>(
      () => {
        return this.db
          .update(operationsTable)
          .set({ isTombstone: true })
          .where(
            and(
              eq(operationsTable.entryId, entryId),
              eq(operationsTable.userId, userId),
            ),
          )
          .returning()
          .all();
      },
      'OperationRepository.softDeleteByEntryId',
      {
        field: 'entryId',
        tableName: 'operations',
        value: entryId,
      },
    );
  }
}
