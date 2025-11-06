import { OperationRepositoryInterface } from 'src/application';
import { DataBase } from 'src/db';
import {
  OperationDbInsert,
  OperationDbRow,
  operationsTable,
} from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';
import { TransactionManager } from '../TransactionManager';

export class OperationRepository
  extends BaseRepository
  implements OperationRepositoryInterface
{
  constructor(db: DataBase, transactionManager: TransactionManager) {
    super(db, transactionManager);
  }
  create(operation: OperationDbInsert): Promise<OperationDbRow> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.insert(operationsTable).values(operation).returning().get(),
      'OperationRepository.create',
      { field: 'operation', tableName: 'operations', value: operation.id },
    );
  }
}
