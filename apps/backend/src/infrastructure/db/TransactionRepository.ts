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
        // TODO: fix n + 1 problem
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

  async create(dto: TransactionCreate): Promise<TransactionResponse> {
    return this.executeDatabaseOperation(async () => {
      return await this.db.transaction(async (tx) => {
        const now = new Date().toISOString();

        const [createdTransaction] = await tx
          .insert(transactions)
          .values({
            ...dto,
            createdAt: now,
            updatedAt: now,
            userId: dto.userId,
          })
          .returning();

        if (dto.operations.length === 0) {
          return { ...createdTransaction, operations: [] };
        }

        const createdOperations = await tx
          .insert(operations)
          .values(
            dto.operations.map((op) => ({
              ...op,
              createdAt: now,
              transactionId: createdTransaction.id,
              updatedAt: now,
              userId: dto.userId,
            })),
          )
          .returning();

        return { ...createdTransaction, operations: createdOperations };
      });
    }, 'Failed to create transaction');
  }

  async delete(id: string): Promise<void> {
    return this.executeDatabaseOperation(async () => {
      await this.db.delete(transactions).where(eq(transactions.id, id));
    }, 'Failed to delete transaction');
  }

  update(_id: number, _data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}
