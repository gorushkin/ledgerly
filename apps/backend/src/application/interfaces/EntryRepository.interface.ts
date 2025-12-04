import { UUID } from '@ledgerly/shared/types';
import { EntryDbInsert, EntryDbRow } from 'src/db/schemas/entries';

export type EntryRepositoryInterface = {
  create(entry: EntryDbInsert): Promise<EntryDbRow>;
  getByTransactionId(userId: UUID, transactionId: UUID): Promise<EntryDbRow[]>;
  softDeleteByTransactionId(
    userId: UUID,
    transactionId: UUID,
  ): Promise<EntryDbRow[]>;
  deleteByTransactionId(userId: UUID, transactionId: UUID): Promise<void>;
};
