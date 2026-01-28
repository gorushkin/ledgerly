import { UUID } from '@ledgerly/shared/types';
import { OperationDbInsert } from 'src/db/schema';

export type OperationRepositoryInterface = {
  save(
    userId: UUID,
    data: {
      insert: OperationDbInsert[];
      update: OperationDbInsert[];
      delete: UUID[];
    },
  ): Promise<void>;
};
