import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import {
  EntryMapper,
  EntryRepositoryInterface,
  OperationMapper,
  OperationRepositoryInterface,
  TransactionMapper,
  TransactionRepositoryInterface,
} from 'src/application';
import {
  EntryDbInsert,
  EntryDbRow,
  OperationDbRow,
  TransactionDbRow,
  TransactionWithRelations,
  transactionsTable,
} from 'src/db/schema';
import { Transaction } from 'src/domain';
import { EntrySnapshot } from 'src/domain/entries/types';

import { BaseRepository } from '../BaseRepository';

export class TransactionRepository
  extends BaseRepository
  implements TransactionRepositoryInterface
{
  constructor(
    readonly entriesRepository: EntryRepositoryInterface,
    readonly operationsRepository: OperationRepositoryInterface,
    transactionManager: BaseRepository['transactionManager'],
  ) {
    super(transactionManager);
  }
  delete(_userId: UUID, _transactionId: UUID): Promise<void> {
    throw new Error('Method not implemented.');
  }

  private insert(
    userId: UUID,
    transaction: Transaction,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(
      async () => {
        const transactionData = TransactionMapper.toDBRow(transaction);

        return this.db
          .insert(transactionsTable)
          .values({ ...transactionData, userId })
          .returning()
          .get();
      },
      'TransactionRepository.create',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }

  private getEntries(_entriesData: EntrySnapshot[]): {
    insert: EntryDbInsert[];
    update: EntryDbInsert[];
    delete: UUID[];
  } {
    return { delete: [], insert: [], update: [] };
  }

  async save(userId: UUID, transaction: Transaction): Promise<void> {
    await this.executeDatabaseOperation(
      async () => {
        const entriesToInsert: EntryDbInsert[] = [];
        const entriesToUpdate: EntryDbInsert[] = [];
        const entriesToDelete: UUID[] = [];

        const operationsToInsert: OperationDbRow[] = [];
        const operationsToUpdate: OperationDbRow[] = [];
        const operationsToDelete: UUID[] = [];

        const entries: EntryDbRow[] = [];
        const operations: OperationDbRow[] = [];

        transaction.getEntries().forEach((entry) => {
          entries.push(EntryMapper.toDBRow(entry));

          entry.getOperations().forEach((operation) => {
            operations.push(OperationMapper.toDBRow(operation));
          });
        });

        const snapshot = await this.getTransactionSnapshot(
          transaction.getUserId().valueOf(),
          transaction.getId().valueOf(),
        );

        if (!snapshot) {
          await this.insert(userId, transaction);

          entriesToInsert.push(...entries);

          operationsToInsert.push(...operations);
        }

        await this.entriesRepository.save(userId, {
          delete: entriesToDelete,
          insert: entriesToInsert,
          update: entriesToUpdate,
        });

        await this.operationsRepository.save(userId, {
          delete: operationsToDelete,
          insert: operationsToInsert,
          update: operationsToUpdate,
        });
      },
      'TransactionRepository.save',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }

  getTransactionSnapshot(
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

        if (!transactionDbRow) {
          return null;
        }

        return transactionDbRow;
      },
      'TransactionRepository.getById',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transactionId,
      },
    );
  }

  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null> {
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

        if (!transactionDbRow) {
          return null;
        }

        const transaction = Transaction.restore(transactionDbRow);

        return transaction;
      },
      'TransactionRepository.getById',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transactionId,
      },
    );
  }

  // update(_transaction: Transaction): Promise<void> {
  // throw new Error('Method not implemented.');
  // return this.executeDatabaseOperation(
  //   async () => {
  //     const safeData = this.getSafeUpdate(transaction, [
  //       'description',
  //       'postingDate',
  //       'transactionDate',
  //       'updatedAt',
  //     ]);

  //     const updated = await this.db
  //       .update(transactionsTable)
  //       .set(safeData)
  //       .where(
  //         and(
  //           eq(transactionsTable.id, transactionId),
  //           eq(transactionsTable.userId, userId),
  //         ),
  //       )
  //       .returning()
  //       .get();

  //     return this.ensureEntityExists(
  //       updated,
  //       `Transaction with ID ${transactionId} not found`,
  //     );
  //   },
  //   'TransactionRepository.update',
  //   {
  //     field: 'transactionId',
  //     tableName: 'transactions',
  //     value: transactionId,
  //   },
  // );
  // }
}
