import { UUID } from '@ledgerly/shared/types';
import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

export type OperationRepositoryInterface = {
  create(operation: OperationDbInsert): Promise<OperationDbRow>;
  getByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]>;
  softDeleteByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]>;
};
