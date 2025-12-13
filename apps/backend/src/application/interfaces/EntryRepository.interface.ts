import { UUID } from '@ledgerly/shared/types';
import { EntryDbInsert, EntryDbRow } from 'src/db/schemas/entries';

export type EntryRepositoryInterface = {
  create(entry: EntryDbInsert): Promise<EntryDbRow>;
  update(userId: UUID, entry: EntryDbInsert): Promise<EntryDbRow>;
  getByTransactionId(userId: UUID, transactionId: UUID): Promise<EntryDbRow[]>;
  voidByTransactionId(userId: UUID, transactionId: UUID): Promise<EntryDbRow[]>;

  voidByIds(userId: UUID, entryIds: UUID[]): Promise<EntryDbRow[]>;
};
