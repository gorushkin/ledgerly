import {
  AccountCreateDTO,
  OperationDbPreHashDTO,
  TransactionDbPreHashDTO,
} from '@ledgerly/shared/types';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { getOperationHash, getTransactionHash } from 'src/libs/hashGenerator';
import { TransactionService } from 'src/services/transaction.service';
import { DataBase } from 'src/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('TransactionService', () => {
  const transactionRepository = {
    create: vi.fn(),
    getAll: vi.fn(),
    getAllByUserId: vi.fn(),
    getById: vi.fn(),
  };

  const operationRepository = {
    bulkInsert: vi.fn(),
    getByTransactionId: vi.fn(),
    getByTransactionIds: vi.fn(),
  };

  const mockTx = { id: 'mock-transaction' };

  const db = {
    transaction: vi.fn().mockImplementation(async (callback) => {
      return await callback(mockTx);
    }),
  } as unknown as DataBase;

  const accountDataInsert: AccountCreateDTO = {
    initialBalance: 1000,
    name: 'Test Account',
    originalCurrency: 'USD',
    type: 'liability',
    userId: 'first-user-id',
  };

  const transactionOneRecord = {
    id: 'transaction-1',
    userId: accountDataInsert.userId,
  };

  const transactionOneOperations = [
    { id: 'operation-1', transactionId: transactionOneRecord.id },
    { id: 'operation-1', transactionId: transactionOneRecord.id },
    { id: 'operation-1', transactionId: transactionOneRecord.id },
  ];

  let transactionService: TransactionService;

  beforeEach(() => {
    transactionService = new TransactionService(
      transactionRepository as unknown as TransactionRepository,
      operationRepository as unknown as OperationRepository,
      db,
    );
  });

  describe.skip('getAllByUserId', () => {
    it('should call the repository method with the correct user ID and return empty array', async () => {
      const userId = accountDataInsert.userId;

      transactionRepository.getAllByUserId.mockResolvedValue([]);

      await transactionService.getAllByUserId(userId);

      expect(transactionRepository.getAllByUserId).toHaveBeenCalledWith(userId);
    });

    it('should return transactions with operations', async () => {
      const userId = accountDataInsert.userId;

      const transactionsList = [
        transactionOneRecord,
        { id: 'transaction-2', operations: [], userId },
      ];

      const transactionTwoOperations = [
        { id: 'operation-2', transactionId: 'transaction-2' },
        { id: 'operation-3', transactionId: 'transaction-2' },
        { id: 'operation-4', transactionId: 'transaction-2' },
      ];

      const operationsList = [
        ...transactionOneOperations,
        ...transactionTwoOperations,
      ];

      transactionRepository.getAllByUserId.mockResolvedValue(transactionsList);

      operationRepository.getByTransactionIds.mockResolvedValue(operationsList);

      const result = await transactionService.getAllByUserId(userId);

      expect(result).toHaveLength(transactionsList.length);
      expect(result[0].id).toBe('transaction-1');
      expect(result[1].id).toBe('transaction-2');
      expect(result[0].operations).toHaveLength(
        transactionOneOperations.length,
      );
      expect(result[1].operations).toHaveLength(
        transactionTwoOperations.length,
      );
    });
  });

  describe.skip('getById', () => {
    it('should return transaction by ID', async () => {
      transactionRepository.getById.mockResolvedValue(transactionOneRecord);
      operationRepository.getByTransactionId.mockResolvedValue(
        transactionOneOperations,
      );

      const result = await transactionService.getById(
        accountDataInsert.userId,
        transactionOneRecord.id,
      );

      expect(result).toEqual({
        ...transactionOneRecord,
        operations: transactionOneOperations,
      });
    });

    it('should throw NotFoundError if transaction does not exist', async () => {
      transactionRepository.getById.mockResolvedValue(null);

      await expect(
        transactionService.getById(
          accountDataInsert.userId,
          transactionOneRecord.id,
        ),
      ).rejects.toThrowError(new Error('Transaction not found'));
    });

    it('should throw NotFoundError if transaction does not belong to user', async () => {
      const anotherUserId = 'another-user-id';

      transactionRepository.getById.mockResolvedValue({
        ...transactionOneRecord,
        userId: anotherUserId,
      });

      await expect(
        transactionService.getById(
          accountDataInsert.userId,
          transactionOneRecord.id,
        ),
      ).rejects.toThrowError(new Error('Transaction not found'));
    });
  });

  describe('create', () => {
    it('should create transaction with valid balanced operations', async () => {
      const userId = accountDataInsert.userId;

      const newTransaction: TransactionDbPreHashDTO = {
        description: 'Test Transaction',
        id: 'new-transaction-id',
        postingDate: new Date().toISOString(),
        transactionDate: new Date().toISOString(),
        userId,
      };

      const operations: OperationDbPreHashDTO[] = [
        {
          accountId: 'account-1',
          categoryId: 'category-1',
          createdAt: new Date().toISOString(),
          description: 'Operation 1',
          id: 'operation-5',
          localAmount: 100,
          originalAmount: 100,
          transactionId: newTransaction.id,
          updatedAt: new Date().toISOString(),
          userId,
        },
        {
          accountId: 'account-2',
          categoryId: 'category-2',
          createdAt: new Date().toISOString(),
          description: 'Operation 2',
          id: 'operation-6',
          localAmount: -100,
          originalAmount: -100,
          transactionId: newTransaction.id,
          updatedAt: new Date().toISOString(),
          userId,
        },
      ];

      const operationsWithHash = operations.map((op) => ({
        ...op,
        hash: getOperationHash(op),
      }));

      const transactionWithHash = {
        ...newTransaction,
        hash: getTransactionHash(newTransaction),
      };

      transactionRepository.create.mockResolvedValue(transactionWithHash);
      operationRepository.bulkInsert.mockResolvedValue(operationsWithHash);

      const fullTransaction = {
        ...transactionWithHash,
        operations: operationsWithHash,
      };

      const result = await transactionService.create(userId, fullTransaction);

      expect(transactionRepository.create).toHaveBeenCalledWith(
        fullTransaction,
        mockTx,
      );

      expect(operationRepository.bulkInsert).toHaveBeenCalledWith(
        operationsWithHash,
        mockTx,
      );

      expect(result).toEqual(fullTransaction);
    });
  });
});
