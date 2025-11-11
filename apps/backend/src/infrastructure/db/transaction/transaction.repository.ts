import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
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

  getById(userId: UUID, transactionId: UUID): Promise<TransactionDbRow | null> {
    return this.executeDatabaseOperation(
      async () => {
        const result = await this.db
          .select()
          .from(transactionsTable)
          .where(
            and(
              eq(transactionsTable.id, transactionId),
              eq(transactionsTable.userId, userId),
            ),
          )
          .get();

        return result ?? null;
      },
      'TransactionRepository.getById',
      { field: 'transaction', tableName: 'transactions', value: transactionId },
    );
  }
}
