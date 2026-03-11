import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { TransactionQueryRepositoryInterface } from 'src/application/interfaces/TransactionQueryRepository.interface';
import { TransactionWithRelations } from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

/**
 * Query repository for read-only transaction operations.
 * Returns DTOs optimized for display without full domain model restoration.
 */
export class TransactionQueryRepository
  extends BaseRepository
  implements TransactionQueryRepositoryInterface
{
  findById(
    _userId: UUID,
    _transactionId: UUID,
  ): Promise<TransactionWithRelations | null> {
    throw new Error(
      'Method not implemented. Use findAll with filtering instead.',
    );
    // return this.executeDatabaseOperation(
    //   async () => {
    //     const transactionDbRow: TransactionWithRelations | undefined =
    //       await this.db.query.transactionsTable.findFirst({
    //         where: and(
    //           eq(transactionsTable.id, transactionId),
    //           eq(transactionsTable.userId, userId),
    //         ),
    //         with: {
    //           entries: { with: { operations: true } },
    //         },
    //       });

    //     return transactionDbRow ?? null;
    //   },
    //   'TransactionQueryRepository.findById',
    //   {
    //     field: 'transactionId',
    //     tableName: 'transactions',
    //     value: transactionId,
    //   },
    // );
  }

  findAll(
    _userId: UUID,
    _query?: TransactionQueryParams,
  ): Promise<TransactionWithRelations[]> {
    throw new Error(
      'Method not implemented. Use findById for specific transaction retrieval.',
    );
    // return this.executeDatabaseOperation(
    //   async () => {
    //     const accountFilter = query?.accountId
    //       ? eq(operationsTable.accountId, query.accountId)
    //       : undefined;

    //     const transactionRows = await this.db
    //       .select({ id: transactionsTable.id })
    //       .from(transactionsTable)
    //       .innerJoin(
    //         entriesTable,
    //         and(
    //           eq(entriesTable.transactionId, transactionsTable.id),
    //           eq(entriesTable.userId, userId),
    //         ),
    //       )
    //       .innerJoin(
    //         operationsTable,
    //         and(
    //           eq(operationsTable.entryId, entriesTable.id),
    //           eq(operationsTable.userId, userId),
    //           ...(accountFilter ? [accountFilter] : []),
    //         ),
    //       )
    //       .groupBy(transactionsTable.id)
    //       .orderBy(transactionsTable.createdAt);

    //     const transactionIds = transactionRows.map((r) => r.id);

    //     if (transactionIds.length === 0) return [];

    //     return await this.db.query.transactionsTable.findMany({
    //       where: inArray(transactionsTable.id, transactionIds),
    //       with: {
    //         entries: { with: { operations: true } },
    //       },
    //     });
    //   },
    //   'TransactionQueryRepository.findAll',
    //   {
    //     field: 'transactions',
    //     tableName: 'transactions',
    //     value: JSON.stringify(query),
    //   },
    // );
  }
}
