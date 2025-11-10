import { UUID } from 'node_modules/@ledgerly/shared/src/types/types';
import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

export type OperationRepositoryInterface = {
  create(operation: OperationDbInsert): Promise<OperationDbRow>;
  getByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]>;
};
