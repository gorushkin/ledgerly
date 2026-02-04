import { UUID } from '@ledgerly/shared/types';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { EntryRepositoryInterface } from 'src/application';
import { entriesTable, EntryDbInsert, EntryDbRow } from 'src/db/schema';
import { Timestamp } from 'src/domain/domain-core';
import { EntrySnapshot } from 'src/domain/entries/types';

import { BaseRepository } from '../BaseRepository';

export class EntryRepository
  extends BaseRepository
  implements EntryRepositoryInterface
{
  private bulkUpdate(
    userId: UUID,
    entries: EntryDbInsert[],
  ): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        // TODO: add updating field validations to allow only specific fields to be updated in bulk update and throw error if other fields are being updated. For now we allow only description to be updated in bulk update.
        if (entries.length === 0) {
          return [];
        }

        const entryIds = entries.map((e) => e.id);
        const updatedAt = Timestamp.create().valueOf();

        const descriptionCases = entries.map(
          (entry) => sql`WHEN ${entry.id} THEN ${entry.description}`,
        );

        return await this.db
          .update(entriesTable)
          .set({
            description: sql`CASE ${entriesTable.id} ${sql.join(descriptionCases, sql.raw(' '))} END`,
            updatedAt,
          })
          .where(
            and(
              inArray(entriesTable.id, entryIds),
              eq(entriesTable.userId, userId),
            ),
          )
          .returning()
          .all();
      },
      'EntryRepository.bulkUpdate',
      {
        field: 'entryIds',
        tableName: 'entries',
        value: entries.map((e) => e.id).join(','),
      },
    );
  }

  voidByIds(userId: UUID, entryIds: UUID[]): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation<EntryDbRow[]>(
      () => {
        return this.db
          .update(entriesTable)
          .set({ isTombstone: true, ...this.updateTimestamp })
          .where(
            and(
              inArray(entriesTable.id, entryIds),
              eq(entriesTable.userId, userId),
            ),
          )
          .returning()
          .all();
      },
      'EntryRepository.voidByIds',
      { field: 'entryIds', tableName: 'entries', value: entryIds.join(',') },
    );
  }

  private insert(
    userId: UUID,
    entries: EntryDbInsert[],
  ): Promise<EntryDbRow[]> {
    return this.executeDatabaseOperation(
      async () => {
        if (entries.length === 0) {
          return [];
        }

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
        await this.bulkUpdate(userId, entriesToUpdate);
        await this.voidByIds(userId, entriesToDelete);
      },
      'EntryRepository.save',
      {
        field: 'entryIds',
        tableName: 'entries',
        value: entries.map((e) => e.id).join(','),
      },
    );
  }
}
