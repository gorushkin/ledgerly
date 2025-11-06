import { TransactionRepositoryInterface } from 'src/application';
import {
  TransactionDbInsert,
  TransactionDbRow,
  transactionsTable,
} from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

export class TransactionRepository
  extends BaseRepository
  implements TransactionRepositoryInterface
{
  create(transaction: TransactionDbInsert): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(
      async () =>
        this.db.insert(transactionsTable).values(transaction).returning().get(),
      'TransactionRepository.create',
      {
        field: 'transaction',
        tableName: 'transactions',
        value: transaction.id,
      },
    );
  }
}
