import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import { TransactionQueryRepositoryInterface } from 'src/application/interfaces/TransactionQueryRepository.interface';
import {
  operationsTable,
  transactionsTable,
  TransactionWithRelations,
} from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

/**
 * Query repository for read-only transaction operations.
 * Returns DTOs optimized for display without full domain model restoration.
 */
export class TransactionQueryRepository
  extends BaseRepository
  implements TransactionQueryRepositoryInterface
{
  constructor(
    readonly transactionManager: BaseRepository['transactionManager'],
  ) {
    super(transactionManager);
  }

  async findById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null> {
    return this.executeDatabaseOperation(
      async () => {
        const transaction = await this.db.query.transactionsTable.findFirst({
          where: and(
            eq(transactionsTable.id, transactionId),
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.isTombstone, false),
          ),
          with: {
            operations: {
              where: eq(operationsTable.isTombstone, false),
            },
          },
        });

        return transaction ?? null;
      },
      'TransactionQueryRepository.findById',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transactionId,
      },
    );
  }

  async findAll(
    userId: UUID,
    query?: TransactionQueryParams,
  ): Promise<TransactionWithRelations[]> {
    return this.executeDatabaseOperation(
      async () => {
        const transactions = await this.db.query.transactionsTable.findMany({
          where: and(
            eq(transactionsTable.userId, userId),
            eq(transactionsTable.isTombstone, false),
          ),
          with: {
            operations: query?.accountId
              ? {
                  where: and(
                    eq(operationsTable.accountId, query.accountId),
                    eq(operationsTable.isTombstone, false),
                  ),
                }
              : true,
          },
        });

        if (!query?.accountId) {
          return transactions;
        }

        return transactions.filter(
          (transaction) => transaction.operations.length,
        );
      },
      'TransactionQueryRepository.findAll',
      {
        field: 'transactions',
        tableName: 'transactions',
        value: JSON.stringify(query),
      },
    );
  }
}
