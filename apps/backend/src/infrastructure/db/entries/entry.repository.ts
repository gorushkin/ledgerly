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
}
