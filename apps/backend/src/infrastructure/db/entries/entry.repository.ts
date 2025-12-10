import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { EntryRepositoryInterface } from 'src/application';
import { entriesTable, EntryDbInsert, EntryDbRow } from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

export class EntryRepository
  extends BaseRepository
  implements EntryRepositoryInterface
{
  update(_userId: UUID, _entry: EntryDbInsert): Promise<EntryDbRow> {
    throw new Error('Method not implemented.');
  }
  voidByIds(_userId: UUID, _entryIds: UUID[]): Promise<EntryDbRow[]> {
    throw new Error('Method not implemented.');
  }

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

  async voidByTransactionId(
    userId: UUID,
    transactionId: UUID,
  ): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation<EntryDbRow[]>(
      () => {
        return this.db
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
      },
      'EntryRepository.softDeleteByTransactionId',
      {
        field: 'transactionId',
        tableName: 'entries',
        value: transactionId,
      },
    );
  }

  async deleteByTransactionId(
    userId: UUID,
    transactionId: UUID,
  ): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation<EntryDbRow[]>(
      () => {
        return this.db
          .delete(entriesTable)
          .where(
            and(
              eq(entriesTable.transactionId, transactionId),
              eq(entriesTable.userId, userId),
            ),
          )
          .returning()
          .all();
      },
      'EntryRepository.deleteByTransactionId',
      {
        field: 'transactionId',
        tableName: 'entries',
        value: transactionId,
      },
    );
  }
}
