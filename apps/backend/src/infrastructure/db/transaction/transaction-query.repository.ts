import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { and, asc, count, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import {
  PaginatedResult,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';
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
    query: TransactionQueryParams,
  ): Promise<PaginatedResult<TransactionWithRelations>> {
    return this.executeDatabaseOperation(
      async () => {
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
              where: and(eq(operationsTable.isTombstone, false)),
            },
          },
        });

        const [countResult] = await this.db
          .select({ total: count() })
          .from(transactionsTable)
          .where(transactionWhereConditions);

        return {
          items,
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
