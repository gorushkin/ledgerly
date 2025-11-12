import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { TransactionRepositoryInterface } from 'src/application';
import {
  TransactionDbInsert,
  TransactionDbRow,
  TransactionWithRelations,
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

  getById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null> {
    return this.executeDatabaseOperation(
      async () => {
        const result: TransactionWithRelations | undefined =
          await this.db.query.transactionsTable.findFirst({
            where: and(
              eq(transactionsTable.id, transactionId),
              eq(transactionsTable.userId, userId),
            ),
            with: {
              entries: { with: { operations: true } },
            },
          });

        return result ?? null;
      },
      'TransactionRepository.getById',
      { field: 'transaction', tableName: 'transactions', value: transactionId },
    );
  }
  getByAccountId(
    _userId: UUID,
    _accountId: UUID,
  ): Promise<TransactionWithRelations[]> {
    throw new Error('Method not implemented.');
  }
}
