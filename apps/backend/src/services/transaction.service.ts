// TODO: fix this
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  EntryCreateDTO,
  TransactionCreateDTO_DELETE,
  TransactionDbRowDTO_DELETE,
  TransactionResponseDTO_DELETE,
  UUID,
} from '@ledgerly/shared/types';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { validateTransactionHash } from 'src/libs/hashGenerator';
import { DataBase } from 'src/types';

import { BaseService } from './baseService';

export class TransactionService extends BaseService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly operationRepository: OperationRepository,
    private readonly db: DataBase,
  ) {
    super();
  }

  private getTransactionsOperations = async (
    transactionsList: Omit<TransactionResponseDTO_DELETE, 'operations'>[],
  ): Promise<TransactionResponseDTO_DELETE[]> => {
    const transactionResponseMap = new Map<
      UUID,
      TransactionResponseDTO_DELETE
    >();

    const ids = transactionsList.map((transaction) => {
      transactionResponseMap.set(transaction.id, {
        ...transaction,
        operations: [],
      });
      return transaction.id;
    });

    if (ids.length === 0) return [];

    const operations = await this.operationRepository.getByTransactionIds(ids);

    operations.forEach((op) => {
      const transaction = transactionResponseMap.get(op.transactionId);
      if (transaction) {
        transaction.operations.push(op);
      }
    });

    return Array.from(transactionResponseMap.values());
  };

  async getAllByUserId(userId: UUID): Promise<TransactionResponseDTO_DELETE[]> {
    const transactions =
      await this.transactionRepository.getAllByUserId(userId);

    return this.getTransactionsOperations(transactions);
  }

  async ensureTransactionExistsAndOwned(
    userId: UUID,
    id: UUID,
  ): Promise<TransactionDbRowDTO_DELETE> {
    const transaction = this.ensureEntityExists(
      await this.transactionRepository.getById(userId, id),
      'Transaction not found',
      {
        attemptedUserId: userId,
        entity: 'Transaction',
        entityId: id,
        reason: 'missing',
      },
    );

    this.ensureAuthorized(
      transaction?.userId === userId,
      'Transaction not found',
      {
        attemptedUserId: userId,
        entity: 'Transaction',
        entityId: id,
        ownerUserId: transaction?.userId,
        reason: 'forbidden',
      },
    );

    return transaction;
  }

  async getById(
    userId: UUID,
    id: UUID,
  ): Promise<TransactionResponseDTO_DELETE | undefined> {
    const transaction = await this.ensureTransactionExistsAndOwned(userId, id);

    const operations = await this.operationRepository.listByTransactionId(id);

    return { ...transaction, operations };
  }

  private validateTransactionHash = (
    transaction: TransactionCreateDTO_DELETE,
  ) => {
    const isHashValid = validateTransactionHash(transaction);

    if (!isHashValid) {
      // This should be a custom error type in a real application
      // throw new InvalidTransactionHashError(transaction.hash);
      console.error('Invalid transaction hash:', transaction.hash);
      // For now, we just throw a generic error
      // In a real application, you might want to throw a custom error type
      // or handle it in a way that fits your application's error handling strategy
      throw new Error('Invalid transaction hash');
    }
  };

  private validateOperations = (operations: EntryCreateDTO[]) => {
    if (!operations || operations.length === 0) {
      throw new Error('Transaction must have at least one operation');
    }

    // Additional validation logic for operations can be added here
  };

  private validateTransaction = (data: TransactionCreateDTO_DELETE) => {
    this.validateTransactionHash(data);
    this.validateOperations(data.operations);
  };

  async create(
    _userId: UUID,
    data: TransactionCreateDTO_DELETE,
  ): Promise<TransactionResponseDTO_DELETE> {
    this.validateTransaction(data);

    return this.db.transaction((_tx) => {
      throw new Error('Method not implemented.');
    });
  }

  update(): Promise<TransactionResponseDTO_DELETE> {
    throw new Error('Method not implemented.');
  }

  delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export class CreateTransactionUseCase {
  constructor(
    private transactionRepository: TransactionRepository,
    private operationRepository: OperationRepository,
    private db: DataBase,
  ) {}

  async execute(
    userId: UUID,
    data: TransactionCreateDTO,
  ): Promise<TransactionResponseDTO> {
    // Валидация и бизнес-логика создания транзакции
  }
}
