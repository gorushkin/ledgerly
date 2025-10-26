import { EntryDbInsert, EntryDbRow } from 'src/db/schemas/entries';

export type EntryRepositoryInterface = {
  create(entry: EntryDbInsert): Promise<EntryDbRow>;
};
