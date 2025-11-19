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

  deleteByTransactionId(_userId: UUID, _transactionId: UUID): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
