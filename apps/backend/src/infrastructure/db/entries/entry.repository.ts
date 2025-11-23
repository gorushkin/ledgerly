import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { EntryRepositoryInterface } from 'src/application';
import { entriesTable, EntryDbInsert, EntryDbRow } from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

export class EntryRepository
  extends BaseRepository
  implements EntryRepositoryInterface
{
  create(entry: EntryDbInsert): Promise<EntryDbRow> {
    return this.executeDatabaseOperation(
      async () => this.db.insert(entriesTable).values(entry).returning().get(),
      'EntryRepository.create',
      { field: 'entry', tableName: 'entries', value: entry.id },
    );
  }

  getByTransactionId(userId: UUID, transactionId: UUID): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation(
      async () =>
        this.db
          .select()
          .from(entriesTable)
          .where(
            and(
              eq(entriesTable.transactionId, transactionId),
              eq(entriesTable.userId, userId),
            ),
          )
          .all(),
      'EntryRepository.getByTransactionId',
      { field: 'transactionId', tableName: 'entries', value: transactionId },
    );
  }

  async softDeleteByTransactionId(
    userId: UUID,
    transactionId: UUID,
  ): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation<EntryDbRow[]>(
      async () => {
        const result: EntryDbRow[] = await this.db
          .update(entriesTable)
          .set({ isTombstone: true })
          .where(
            and(
              eq(entriesTable.transactionId, transactionId),
              eq(entriesTable.userId, userId),
            ),
          )
          .returning()
          .all();

        return result;
      },
      'EntryRepository.softDeleteByTransactionId',
      {
        field: 'transactionId',
        tableName: 'entries',
        value: transactionId,
      },
    );
  }
}
