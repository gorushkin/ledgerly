import { UUID } from '@ledgerly/shared/types';
import { and, eq, inArray } from 'drizzle-orm';
import { TransactionRepositoryInterface } from 'src/application';
import {
  TransactionDbInsert,
  TransactionDbRow,
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

  async getByAccountId(
    userId: UUID,
    accountId: UUID,
  ): Promise<TransactionWithRelations[]> {
    const txRows = await this.db
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
        ),
      )
      .where(eq(operationsTable.accountId, accountId))
      .groupBy(transactionsTable.id)
      .orderBy(transactionsTable.createdAt);

    const txIds = txRows.map((r) => r.id);

    if (txIds.length === 0) return [];

    const fullTx = await this.db.query.transactionsTable.findMany({
      where: inArray(transactionsTable.id, txIds),
      with: {
        entries: { with: { operations: true } },
      },
    });

    return fullTx;
  }
}
