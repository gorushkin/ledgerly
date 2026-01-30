import { UUID } from '@ledgerly/shared/types';
import { EntryDbInsert } from 'src/db/schemas/entries';

export type EntryRepositoryInterface = {
  save(
    userId: UUID,
    data: {
      insert: EntryDbInsert[];
      update: EntryDbInsert[];
      delete: UUID[];
    },
  ): Promise<void>;
};
