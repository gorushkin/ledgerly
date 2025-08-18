// TODO: fix this
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import {
  OperationDbInsert,
  TransactionDbPreHashDTO,
} from '@ledgerly/shared/types';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import {
  computeOperationHash,
  getTransactionHash,
} from 'src/libs/hashGenerator';
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

  const userId = 'test-user-id';

  const mockTx = { id: 'mock-transaction' };

  const db = {
    transaction: vi
      .fn()
      .mockImplementation(async (callback: (db: unknown) => Promise<void>) => {
        return await callback(mockTx);
      }),
  } as unknown as DataBase;

  const transactionOneRecord = {
    id: 'transaction-1',
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

  describe('getAllByUserId', () => {
    it.skip('should call the repository method with the correct user ID and return empty array', async () => {
      transactionRepository.getAllByUserId.mockResolvedValue([]);

      await transactionService.getAllByUserId(userId);

      expect(transactionRepository.getAllByUserId).toHaveBeenCalledWith(userId);
    });

    it.skip('should return transactions with operations', async () => {
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

  describe('getById', () => {
    it.skip('should return transaction by ID', async () => {
      transactionRepository.getById.mockResolvedValue(transactionOneRecord);
      operationRepository.getByTransactionId.mockResolvedValue(
        transactionOneOperations,
      );

      const result = await transactionService.getById(
        userId,
        transactionOneRecord.id,
      );

      expect(result).toEqual({
        ...transactionOneRecord,
        operations: transactionOneOperations,
      });
    });

    it.skip('should throw NotFoundError if transaction does not exist', async () => {
      transactionRepository.getById.mockResolvedValue(null);

      await expect(
        transactionService.getById(userId, transactionOneRecord.id),
      ).rejects.toThrowError(new Error('Transaction not found'));
    });

    it.skip('should throw NotFoundError if transaction does not belong to user', async () => {
      const anotherUserId = 'another-user-id';

      transactionRepository.getById.mockResolvedValue({
        ...transactionOneRecord,
        userId: anotherUserId,
      });

      await expect(
        transactionService.getById(userId, transactionOneRecord.id),
      ).rejects.toThrowError(new Error('Transaction not found'));
    });
  });

  describe('create', () => {
    it.skip('should create transaction with valid balanced operations', async () => {
      const newTransaction: TransactionDbPreHashDTO = {
        description: 'Test Transaction',
        id: 'new-transaction-id',
        postingDate: new Date().toISOString(),
        transactionDate: new Date().toISOString(),
        userId,
      };

      const operations: OperationDbInsert[] = [
        {
          accountId: 'account-1',
          baseAmount: 100,
          description: 'Operation 1',
          id: 'operation-5',
          isTombstone: false,
          localAmount: 100,
          rateBasePerLocal: '1.0',
          transactionId: newTransaction.id,
          userId,
        },
        {
          accountId: 'account-2',
          baseAmount: -100,
          description: 'Operation 2',
          id: 'operation-6',
          isTombstone: false,
          localAmount: -100,
          rateBasePerLocal: '1.0',
          transactionId: newTransaction.id,
          userId,
        },
      ];

      const operationsWithHash = operations.map((op) => ({
        ...op,
        hash: computeOperationHash(op),
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
