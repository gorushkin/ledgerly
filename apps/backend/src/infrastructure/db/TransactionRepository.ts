import {
  TransactionCreateDTO,
  TransactionResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { eq, inArray, and } from 'drizzle-orm';
import { operationsTable, transactionsTable } from 'src/db/schemas';
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

  private getTransactionOperations = async (
    transactionsList: Omit<TransactionResponseDTO, 'operations'>[],
  ): Promise<TransactionResponseDTO[]> => {
    const transactionResponseMap = new Map<UUID, TransactionResponseDTO>();

    const ids = transactionsList.map((transaction) => {
      transactionResponseMap.set(transaction.id, {
        ...transaction,
        operations: [],
      });
      return transaction.id;
    });

    if (ids.length === 0) return [];

    const operations = await this.db
      .select()
      .from(operationsTable)
      .where(inArray(operationsTable.transactionId, ids))
      .all();

    operations.forEach((op) => {
      const transaction = transactionResponseMap.get(op.transactionId);
      if (transaction) {
        transaction.operations.push(op);
      }
    });

    return Array.from(transactionResponseMap.values());
  };

  async getAll(): Promise<TransactionResponseDTO[]> {
    return this.executeDatabaseOperation(async () => {
      const transactionsList = await this.db
        .select()
        .from(transactionsTable)
        .all();

      return this.getTransactionOperations(transactionsList);
    }, 'Failed to fetch transactions');
  }

  async getAllByUserId(userId: UUID): Promise<TransactionResponseDTO[]> {
    return this.executeDatabaseOperation(async () => {
      const transactionsList = await this.db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.userId, userId))
        .all();

      return this.getTransactionOperations(transactionsList);
    }, 'Failed to fetch transactions');
  }

  async getTransactionById(
    userId: UUID,
    id: UUID,
  ): Promise<TransactionResponseDTO | undefined> {
    return this.executeDatabaseOperation(async () => {
      const transaction = await this.db
        .select()
        .from(transactionsTable)
        .where(
          and(
            eq(transactionsTable.id, id),
            eq(transactionsTable.userId, userId),
          ),
        )
        .get();

      if (!transaction) return undefined;

      const operations = await this.operationRepository.getByTransactionId(
        transaction.id,
      );

      return {
        ...transaction,
        operations,
      };
    }, 'Failed to fetch transaction');
  }

  async create(dto: TransactionCreateDTO): Promise<TransactionResponseDTO> {
    return this.executeDatabaseOperation(async () => {
      return await this.db.transaction(async (tx) => {
        const now = new Date().toISOString();

        const [createdTransaction] = await tx
          .insert(transactionsTable)
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
          .insert(operationsTable)
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
      await this.db
        .delete(transactionsTable)
        .where(eq(transactionsTable.id, id));
    }, 'Failed to delete transaction');
  }

  update(_id: number, _data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
}
