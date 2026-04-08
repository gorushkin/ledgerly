import { UUID } from '@ledgerly/shared/types';
import { and, eq } from 'drizzle-orm';
import {
  OperationMapper,
  OperationRepositoryInterface,
  TransactionMapper,
  TransactionRepositoryInterface,
} from 'src/application';
import {
  OperationDbRow,
  TransactionDbRow,
  TransactionWithRelations,
  transactionsTable,
} from 'src/db/schema';
import { Transaction } from 'src/domain';
import { OperationSnapshot } from 'src/domain/operations/types';

import { BaseRepository } from '../BaseRepository';

export class TransactionRepository
  extends BaseRepository
  implements TransactionRepositoryInterface
{
  constructor(
    readonly operationsRepository: OperationRepositoryInterface,
    readonly transactionManager: BaseRepository['transactionManager'],
  ) {
    super(transactionManager);
  }

  async softDelete(userId: UUID, transaction: Transaction): Promise<void> {
    return this.executeDatabaseOperation(
      async () => {
        await this.db
          .update(transactionsTable)
          .set({ isTombstone: true, ...this.updateTimestamp })
          .where(
            and(
              eq(transactionsTable.id, transaction.getId().valueOf()),
              eq(transactionsTable.userId, userId),
            ),
          );

        await this.saveOperations(transaction);
      },
      'TransactionRepository.softDelete',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
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
      'TransactionRepository.insert',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }

  private async update(
    userId: UUID,
    transaction: Transaction,
  ): Promise<TransactionDbRow> {
    return this.executeDatabaseOperation(
      async () => {
        const transactionData = TransactionMapper.toDBRow(transaction);

        const safeData = this.getSafeUpdate(transactionData, [
          'description',
          'postingDate',
          'transactionDate',
          'updatedAt',
          'currency',
        ]);

        return this.db
          .update(transactionsTable)
          .set({ ...safeData, userId })
          .returning()
          .get();
      },
      'TransactionRepository.update',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }

  private async saveOperations(transaction: Transaction): Promise<void> {
    const operations: OperationDbRow[] = [];

    const operationsSnapshots = new Map<UUID, OperationSnapshot>();

    transaction.getOperations().forEach((operation) => {
      operations.push(OperationMapper.toDBRow(operation));
    });

    const snapshot = await this.getTransactionSnapshot(
      transaction.getUserId().valueOf(),
      transaction.getId().valueOf(),
    );

    snapshot?.operations.forEach((operationSnapshot) => {
      operationsSnapshots.set(operationSnapshot.id, operationSnapshot);
    });

    await this.operationsRepository.save(
      transaction.getUserId().valueOf(),
      operations,
      operationsSnapshots,
    );
  }

  async save(userId: UUID, transaction: Transaction): Promise<void> {
    await this.executeDatabaseOperation(
      async () => {
        await this.update(userId, transaction);
        await this.saveOperations(transaction);
      },
      'TransactionRepository.save',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }

  async getTransactionSnapshot(
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
              operations: true,
            },
          });

        if (!transactionDbRow) {
          return null;
        }

        return transactionDbRow;
      },
      'TransactionRepository.getTransactionSnapshot',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transactionId,
      },
    );
  }

  getById(_userId: UUID, _transactionId: UUID): Promise<Transaction | null> {
    throw new Error('Method not implemented.');
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

    //     if (!transactionDbRow) {
    //       return null;
    //     }

    //     const transaction = Transaction.restore(transactionDbRow);

    //     return transaction;
    //   },
    //   'TransactionRepository.getById',
    //   {
    //     field: 'transactionId',
    //     tableName: 'transactions',
    //     value: transactionId,
    //   },
    // );
  }

  async create(userId: UUID, transaction: Transaction): Promise<void> {
    return await this.executeDatabaseOperation(
      async () => {
        const operationsDataToInsert = transaction
          .getOperations()
          .map((operation) => OperationMapper.toDBRow(operation));

        await this.operationsRepository.save(userId, operationsDataToInsert);

        await this.insert(userId, transaction);
      },
      'TransactionRepository.create',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }
}
