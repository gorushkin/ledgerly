import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { TransactionQueryRepositoryInterface } from 'src/application/interfaces/TransactionQueryRepository.interface';
import {
  TransactionWithRelations,
  entriesTable,
  operationsTable,
  transactionsTable,
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
  async findById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null> {
    return this.executeDatabaseOperation(
      async () => {
        const transactionDbRow: TransactionWithRelations | undefined =
          await this.db.query.transactionsTable.findFirst({
            where: and(
              eq(transactionsTable.id, transactionId),
              eq(transactionsTable.userId, userId),
            ),
            with: {
              entries: { with: { operations: true } },
            },
          });

        return transactionDbRow ?? null;
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
        const accountFilter = query?.accountId
          ? eq(operationsTable.accountId, query.accountId)
          : undefined;

        const transactionRows = await this.db
          .select({ id: transactionsTable.id })
          .from(transactionsTable)
          .innerJoin(
            entriesTable,
            and(
              eq(entriesTable.transactionId, transactionsTable.id),
              eq(entriesTable.userId, userId),
            ),
          )
          .innerJoin(
            operationsTable,
            and(
              eq(operationsTable.entryId, entriesTable.id),
              eq(operationsTable.userId, userId),
              ...(accountFilter ? [accountFilter] : []),
            ),
          )
          .groupBy(transactionsTable.id)
          .orderBy(transactionsTable.createdAt);

        const transactionIds = transactionRows.map((r) => r.id);

        if (transactionIds.length === 0) return [];

        return await this.db.query.transactionsTable.findMany({
          where: inArray(transactionsTable.id, transactionIds),
          with: {
            entries: { with: { operations: true } },
          },
        });
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
