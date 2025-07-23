import { randomUUID } from 'node:crypto';

import {
  TransactionCreate,
  TransactionResponse,
  UUID,
} from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { operations, transactions } from 'src/db/schemas';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';
import { OperationRepository } from './OperationRepository';

export class TransactionRepository extends BaseRepository {
  constructor(
    db: DataBase,
    private readonly operationRepository: OperationRepository,
  ) {
    super(db);
  }

  async getAll(userId: UUID): Promise<TransactionResponse[]> {
    return this.executeDatabaseOperation(async () => {
      const transactionsList = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .all();

      const transactionsWithOperations = await Promise.all(
        transactionsList.map(async (transaction) => {
          const operations = await this.operationRepository.getByTransactionId(
            transaction.id,
          );

          return {
            description: transaction.description,
            id: transaction.id,
            operations,
            postingDate: transaction.postingDate,
            transactionDate: transaction.transactionDate,
          };
        }),
      );
      return transactionsWithOperations;
    }, 'Failed to fetch transactions');
  }

  async getTransactionById(
    id: string,
  ): Promise<TransactionResponse | undefined> {
    return this.executeDatabaseOperation(async () => {
      const transaction = await this.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, id))
        .get();

      if (!transaction) return undefined;

      const operations = await this.operationRepository.getByTransactionId(
        transaction.id,
      );

      return {
        description: transaction.description,
        id: transaction.id,
        operations,
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      };
    }, 'Failed to fetch transaction');
  }

  async createTransaction(
    dto: TransactionCreate,
  ): Promise<TransactionResponse> {
    return this.executeDatabaseOperation(async () => {
      if (dto.operations.length === 0) {
        throw new Error('Transaction must have at least one operation');
      }

      const now = new Date().toISOString();

      const result = await this.db.transaction(async (tx) => {
        const [transaction] = await tx
          .insert(transactions)
          .values({
            description: dto.description,
            postingDate: dto.postingDate,
            transactionDate: dto.transactionDate,
          })
          .returning();

        const opsToInsert = dto.operations.map((op) => ({
          accountId: op.accountId,
          categoryId: op.categoryId,
          createdAt: now,
          description: op.description,
          id: randomUUID(),
          localAmount: op.localAmount,
          originalAmount: op.originalAmount,
          transactionId: transaction.id,
        }));

        const ops = await tx.insert(operations).values(opsToInsert).returning();

        return { ...transaction, operations: ops };
      });
      return result;
    }, 'Failed to create transaction');
  }

  updateTransaction(_id: number, _data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  deleteTransaction(_id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
