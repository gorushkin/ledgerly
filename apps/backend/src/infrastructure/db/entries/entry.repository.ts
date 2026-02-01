import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { EntryRepositoryInterface } from 'src/application';
import { entriesTable, EntryDbInsert, EntryDbRow } from 'src/db/schema';
import { EntrySnapshot } from 'src/domain/entries/types';

import { BaseRepository } from '../BaseRepository';

export class EntryRepository
  extends BaseRepository
  implements EntryRepositoryInterface
{
  private update(userId: UUID, entry: EntryDbInsert): Promise<EntryDbRow> {
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
  // voidByIds(userId: UUID, entryIds: UUID[]): Promise<EntryDbRow[]> {
  //   return this.executeDatabaseOperation<EntryDbRow[]>(
  //     () => {
  //       return this.db
  //         .update(entriesTable)
  //         .set({ isTombstone: true, ...this.updateTimestamp })
  //         .where(
  //           and(
  //             inArray(entriesTable.id, entryIds),
  //             eq(entriesTable.userId, userId),
  //           ),
  //         )
  //         .returning()
  //         .all();
  //     },
  //     'EntryRepository.voidByIds',
  //     { field: 'entryIds', tableName: 'entries', value: entryIds.join(',') },
  //   );
  // }

  // create(entry: EntryDbInsert): Promise<EntryDbRow> {
  //   return this.executeDatabaseOperation(
  //     async () => this.db.insert(entriesTable).values(entry).returning().get(),
  //     'EntryRepository.create',
  //     { field: 'entry', tableName: 'entries', value: entry.id },
  //   );
  // }

  // getByTransactionId(userId: UUID, transactionId: UUID): Promise<EntryDbRow[]> {
  //   return this.executeDatabaseOperation(
  //     async () =>
  //       this.db
  //         .select()
  //         .from(entriesTable)
  //         .where(
  //           and(
  //             eq(entriesTable.transactionId, transactionId),
  //             eq(entriesTable.userId, userId),
  //           ),
  //         )
  //         .all(),
  //     'EntryRepository.getByTransactionId',
  //     { field: 'transactionId', tableName: 'entries', value: transactionId },
  //   );
  // }

  // async voidByTransactionId(
  //   userId: UUID,
  //   transactionId: UUID,
  // ): Promise<EntryDbRow[]> {
  //   return this.executeDatabaseOperation<EntryDbRow[]>(
  //     () => {
  //       return this.db
  //         .update(entriesTable)
  //         .set({ isTombstone: true, ...this.updateTimestamp })
  //         .where(
  //           and(
  //             eq(entriesTable.transactionId, transactionId),
  //             eq(entriesTable.userId, userId),
  //           ),
  //         )
  //         .returning()
  //         .all();
  //     },
  //     'EntryRepository.softDeleteByTransactionId',
  //     {
  //       field: 'entryIds',
  //       tableName: 'entries',
  //       value: transactionId,
  //     },
  //   );
  // }

  private insert(
    userId: UUID,
    entries: EntryDbInsert[],
  ): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        const rowsToInsert = entries.map((e) => ({
          ...e,
          userId,
        }));

        return this.db
          .insert(entriesTable)
          .values(rowsToInsert)
          .returning()
          .all();
      },
      'EntryRepository.insert',
      {
        field: 'entryIds',
        tableName: 'entries',
        value: entries.map((e) => e.id).join(','),
      },
    );
  }

  save(
    userId: UUID,
    entries: EntryDbRow[],
    snapshots: Map<UUID, EntrySnapshot>,
  ): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        const entriesToInsert: EntryDbInsert[] = [];
        const entriesToUpdate: EntryDbInsert[] = [];
        const entriesToDelete: UUID[] = [];

        entries.forEach((entry) => {
          const matchedEntrySnapshot = snapshots.get(entry.id);

          if (!matchedEntrySnapshot) {
            entriesToInsert.push(entry);
            return;
          }

          if (entry.isTombstone) {
            entriesToDelete.push(entry.id);
            return;
          }

          entriesToUpdate.push(entry);
        });

        await this.insert(userId, entriesToInsert);
      },
      'EntryRepository.save',
      {
        field: 'entryIds',
        tableName: 'entries',
        value: '',
      },
    );
  }
}
