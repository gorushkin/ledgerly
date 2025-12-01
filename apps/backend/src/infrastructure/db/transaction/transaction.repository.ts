import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { TransactionRepositoryInterface } from 'src/application';
import {
  TransactionDbInsert,
  TransactionDbRow,
  TransactionDbUpdate,
  TransactionWithRelations,
  entriesTable,
  operationsTable,
  transactionsTable,
} from 'src/db/schema';

import { BaseRepository } from '../BaseRepository';

export class TransactionRepository
  extends BaseRepository
  implements TransactionRepositoryInterface
{
  delete(_userId: UUID, _transactionId: UUID): Promise<void> {
    throw new Error('Method not implemented.');
  }
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

  async getAll(
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
      'TransactionRepository.getAll',
      {
        field: 'transactions',
        tableName: 'transactions',
        value: JSON.stringify(query),
      },
    );
  }

  update(
    userId: UUID,
    transactionId: UUID,
    transaction: TransactionDbUpdate,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(
      async () => {
        const updated = await this.db
          .update(transactionsTable)
          .set(transaction)
          .where(
            and(
              eq(transactionsTable.id, transactionId),
              eq(transactionsTable.userId, userId),
            ),
          )
          .returning()
          .get();

        return this.ensureEntityExists(
          updated,
          `Transaction with ID ${transactionId} not found`,
        );
      },
      'TransactionRepository.update',
      {
        field: 'transaction',
        tableName: 'transactions',
        value: transactionId,
      },
    );
  }
}
