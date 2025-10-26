import { OperationDbInsert, OperationDbRow } from 'src/db/schema';

export type OperationRepositoryInterface = {
  create(operation: OperationDbInsert): Promise<OperationDbRow>;
};
