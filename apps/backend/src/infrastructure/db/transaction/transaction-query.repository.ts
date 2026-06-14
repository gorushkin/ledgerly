import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { and, asc, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import {
  PaginatedResult,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionReadModel } from 'src/application/read-models';
import { operationsTable, transactionsTable } from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

import { TransactionReadModelMapper } from './transaction-read-model.mapper';

/**
 * Query repository for read-only transaction operations.
 * Maps persistence rows to application read models.
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
  ): Promise<TransactionReadModel | null> {
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

        return transaction
          ? TransactionReadModelMapper.fromPersistence(transaction)
          : null;
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
    query: TransactionQueryParams,
  ): Promise<PaginatedResult<TransactionReadModel>> {
    return this.executeDatabaseOperation(
      async () => {
        // TODO(LED-60): benchmark EXISTS and single-query count alternatives;
        // this account subquery is currently evaluated for both items and total.
        const matchingTransactionIds = query.accountId
          ? inArray(
              transactionsTable.id,
              this.db
                .select({ transactionId: operationsTable.transactionId })
                .from(operationsTable)
                .where(
                  and(
                    eq(operationsTable.accountId, query.accountId),
                    eq(operationsTable.isTombstone, false),
                  ),
                ),
            )
          : undefined;

        const { page, pageSize } = query;
        const offset = (page - 1) * pageSize;

        const sortColumn =
          query.sortBy === 'postingDate'
            ? transactionsTable.postingDate
            : transactionsTable.transactionDate;

        const sortDirection = query.sortOrder === 'asc' ? asc : desc;

        const transactionWhereConditions = and(
          eq(transactionsTable.userId, userId),
          eq(transactionsTable.isTombstone, false),
          ...(query.dateFrom
            ? [gte(transactionsTable.transactionDate, query.dateFrom)]
            : []),
          ...(query.dateTo
            ? [lte(transactionsTable.transactionDate, query.dateTo)]
            : []),
          matchingTransactionIds,
        );

        const items = await this.db.query.transactionsTable.findMany({
          limit: pageSize,
          offset,
          orderBy: [
            sortDirection(sortColumn),
            sortDirection(transactionsTable.createdAt),
            sortDirection(transactionsTable.id),
          ],
          where: transactionWhereConditions,
          with: {
            operations: {
              where: eq(operationsTable.isTombstone, false),
            },
          },
        });

        // TODO(LED-60): avoid reevaluating the account filter when counting.
        const [countResult] = await this.db
          .select({ total: count() })
          .from(transactionsTable)
          .where(transactionWhereConditions);

        return {
          items: items.map((transaction) =>
            TransactionReadModelMapper.fromPersistence(transaction),
          ),
          total: countResult.total,
        };
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
