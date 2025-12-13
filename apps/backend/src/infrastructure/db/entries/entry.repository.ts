import { UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { EntryRepositoryInterface } from 'src/application';
import { entriesTable, EntryDbInsert, EntryDbRow } from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

export class EntryRepository
  extends BaseRepository
  implements EntryRepositoryInterface
{
  update(userId: UUID, entry: EntryDbInsert): Promise<EntryDbRow> {
    return this.executeDatabaseOperation(
      async () => {
        const safeData = this.getSafeUpdate(entry, ['description']);

        return this.db
          .update(entriesTable)
          .set({ ...safeData, ...this.updateTimestamp })
          .where(
            and(eq(entriesTable.id, entry.id), eq(entriesTable.userId, userId)),
          )
          .returning()
          .get();
      },
      'EntryRepository.update',
      { field: 'entry', tableName: 'entries', value: entry.id },
    );
  }
  voidByIds(userId: UUID, _entryIds: UUID[]): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation<EntryDbRow[]>(
      () => {
        return this.db
          .update(entriesTable)
          .set({ isTombstone: true })
          .where(
            and(
              inArray(entriesTable.id, _entryIds),
              eq(entriesTable.userId, userId),
            ),
          )
          .returning()
          .all();
      },
      'EntryRepository.voidByIds',
      { field: 'entryIds', tableName: 'entries', value: _entryIds.join(',') },
    );
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
