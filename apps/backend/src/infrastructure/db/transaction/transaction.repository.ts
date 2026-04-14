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

        await this.saveOperations(userId, transaction);
      },
      'TransactionRepository.softDelete',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }

  private async insertTransactionRow(
    userId: UUID,
    transaction: Transaction,
  ): Promise<void> {
    const transactionData = TransactionMapper.toDBRow(transaction);

    await this.db
      .insert(transactionsTable)
      .values({ ...transactionData, userId });
  }

  private async updateTransactionRow(
    userId: UUID,
    transaction: Transaction,
  ): Promise<void> {
    const transactionData = TransactionMapper.toDBRow(transaction);

    const safeData = this.getSafeUpdate(transactionData, [
      'description',
      'postingDate',
      'transactionDate',
      'updatedAt',
      'currency',
    ]);

    await this.db
      .update(transactionsTable)
      .set({ ...safeData })
      .where(
        and(
          eq(transactionsTable.id, transaction.getId().valueOf()),
          eq(transactionsTable.userId, userId),
        ),
      );
  }

  private async saveOperations(
    userId: UUID,
    transaction: Transaction,
  ): Promise<void> {
    const operations: OperationDbRow[] = [];

    const operationsSnapshots = new Map<UUID, OperationSnapshot>();

    transaction.getOperations().forEach((operation) => {
      operations.push(OperationMapper.toDBRow(operation));
    });

    const snapshot = await this.getTransactionSnapshot(
      userId,
      transaction.getId().valueOf(),
    );

    snapshot?.operations.forEach((operationSnapshot) => {
      operationsSnapshots.set(operationSnapshot.id, operationSnapshot);
    });

    await this.operationsRepository.save(
      userId,
      operations,
      operationsSnapshots,
    );
  }

  async update(userId: UUID, transaction: Transaction): Promise<void> {
    await this.executeDatabaseOperation(
      async () => {
        await this.updateTransactionRow(userId, transaction);
        await this.saveOperations(userId, transaction);
      },
      'TransactionRepository.update',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transaction.getId().valueOf(),
      },
    );
  }
  private async getTransactionSnapshot(
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

  async getById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<Transaction | null> {
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

        return Transaction.restore(transactionDbRow);
      },
      'TransactionRepository.getById',
      {
        field: 'transactionId',
        tableName: 'transactions',
        value: transactionId,
      },
    );
  }

  async create(userId: UUID, transaction: Transaction): Promise<void> {
    await this.executeDatabaseOperation(
      async () => {
        const operationsDataToInsert = transaction
          .getOperations()
          .map((operation) => OperationMapper.toDBRow(operation));

        await this.insertTransactionRow(userId, transaction);

        await this.operationsRepository.save(userId, operationsDataToInsert);
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
