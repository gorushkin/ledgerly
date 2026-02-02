import { UUID } from '@ledgerly/shared/types';
import { EntryDbRow } from 'src/db/schemas/entries';
import { EntrySnapshot } from 'src/domain/entries/types';

export type EntryRepositoryInterface = {
  save(
    userId: UUID,
    entries: EntryDbRow[],
    snapshots: Map<UUID, EntrySnapshot>,
  ): Promise<void>;
};
