import { UUID } from '@ledgerly/shared/types';
import { OperationDbRow } from 'src/db/schema';
import { OperationSnapshot } from 'src/domain/operations/types';

export type OperationRepositoryInterface = {
  save(
    userId: UUID,
    operations: OperationDbRow[],
    snapshots: Map<UUID, OperationSnapshot>,
  ): Promise<void>;
};
