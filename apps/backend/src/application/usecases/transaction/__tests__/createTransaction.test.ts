import {
  TransactionRepositoryInterface,
  UserRepositoryInterface,
} from 'src/application/interfaces';
import { DateValue, Id } from 'src/domain/domain-core';
import { Transaction } from 'src/domain/transactions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', () => {
  let createTransactionUseCase: CreateTransactionUseCase;
  let mockTransactionRepository: { create: ReturnType<typeof vi.fn> };

  let mockUserRepository: { getById: ReturnType<typeof vi.fn> };

  const userIdValue = '550e8400-e29b-41d4-a716-446655440000';
  const userId = Id.fromPersistence(userIdValue).valueOf();
  const transactionIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const postingDate = DateValue.restore('2024-01-01').valueOf();
  const transactionDate = DateValue.restore('2024-01-02').valueOf();
  const description = 'Test Transaction';

  const mockSavedTransactionData = {
    createdAt: new Date().toISOString(),
    description,
    id: transactionIdValue,
    isTombstone: false,
    postingDate,
    transactionDate,
    updatedAt: new Date().toISOString(),
    userId,
  };

  const mockedSaveWithIdRetry = vi
    .fn()
    .mockResolvedValue({ name: 'mocked account' }); // Mock implementation

  beforeEach(() => {
    mockTransactionRepository = {
      create: vi.fn(),
    };

    mockUserRepository = {
      getById: vi.fn(),
    };

    createTransactionUseCase = new CreateTransactionUseCase(
      mockTransactionRepository as unknown as TransactionRepositoryInterface,
      mockUserRepository as unknown as UserRepositoryInterface,
      mockedSaveWithIdRetry,
    );
  });
  describe('execute', () => {
    it('should create a new transaction successfully', async () => {
      const expectedResult = {
        ...mockSavedTransactionData,
        isTombstone: false,
      };

      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      const mockedTransaction = {} as unknown as Transaction;

      vi.spyOn(Transaction, 'create').mockReturnValue(mockedTransaction);

      const result = await createTransactionUseCase.execute(userId, {
        description,
        postingDate,
        transactionDate,
      });

      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        mockedTransaction,
        expect.any(Function),
        expect.any(Function),
      );

      expect(result).toEqual(expectedResult);
    });
  });
});
