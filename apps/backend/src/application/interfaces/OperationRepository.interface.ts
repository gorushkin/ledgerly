import { UUID } from '@ledgerly/shared/types';
import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

export type OperationRepositoryInterface = {
  create(operation: OperationDbInsert): Promise<OperationDbRow>;
  getByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]>;
  voidByEntryIds(userId: UUID, entryIds: UUID[]): Promise<OperationDbRow[]>;
  voidByEntryId(userId: UUID, entryId: UUID): Promise<OperationDbRow[]>;
};
