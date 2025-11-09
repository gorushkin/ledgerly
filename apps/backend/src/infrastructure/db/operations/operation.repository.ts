import { UUID } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
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

  getByEntryId(entryId: UUID): Promise<OperationDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        const result = await this.db
          .select()
          .from(operationsTable)
          .where(eq(operationsTable.entryId, entryId))
          .all();

        return result;
      },
      'OperationRepository.getByEntryId',
      { field: 'operation', tableName: 'operations', value: entryId },
    );
  }
}
