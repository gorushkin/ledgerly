import { UUID } from '@ledgerly/shared/types';
import { OperationSnapshot } from 'src/domain/operations/types';

export type OperationRepositoryInterface = {
  save(
    userId: UUID,
    operations: OperationSnapshot[],
    snapshots?: Map<UUID, OperationSnapshot>,
  ): Promise<void>;
};
