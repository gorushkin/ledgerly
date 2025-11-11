import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application';
import { TransactionDbRow } from 'src/db/schema';
import { DateValue, Id, Timestamp } from 'src/domain/domain-core';
import { describe, expect, it, vi } from 'vitest';

import { GetTransactionByIdUseCase } from '../GetTransactionById';

describe('GetTransactionByIdUseCase', () => {
  const transactionManager = {
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  const mockTransactionRepository = {
    getById: vi.fn(),
  };

  const mockEntryRepository = {
    getByTransactionId: vi.fn(),
  };
  const mockOperationRepository = {
    getByEntryId: vi.fn(),
  };

  const getTransactionByIdUseCase = new GetTransactionByIdUseCase(
    transactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    mockEntryRepository as unknown as EntryRepositoryInterface,
    mockOperationRepository as unknown as OperationRepositoryInterface,
  );

  it('should retrieve transaction by ID', async () => {
    const transactionId = Id.create().valueOf();
    const userId = Id.create().valueOf();
    const createdAt = Timestamp.create().valueOf();
    const updatedAt = Timestamp.create().valueOf();

    const mockTransactionData: TransactionDbRow = {
      createdAt,
      description: 'Test Transaction',
      id: transactionId,
      isTombstone: false,
      postingDate: DateValue.create().valueOf(),
      transactionDate: DateValue.create().valueOf(),
      updatedAt,
      userId,
    };

    const mockEntry1 = {
      createdAt: Timestamp.create().valueOf(),
      id: Id.create().valueOf(),
      isTombstone: false,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
    };

    const mockOperation1 = {
      accountId: Id.create().valueOf(),
      amount: '1000',
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 1',
      entryId: mockEntry1.id,
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      updatedAt: Timestamp.create().valueOf(),
      userId,
    };

    const mockOperation2 = {
      accountId: Id.create().valueOf(),
      amount: '500',
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 2',
      entryId: mockEntry1.id,
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      updatedAt: Timestamp.create().valueOf(),
      userId,
    };

    mockTransactionRepository.getById.mockResolvedValue(mockTransactionData);

    mockEntryRepository.getByTransactionId.mockResolvedValue([mockEntry1]);

    mockOperationRepository.getByEntryId.mockResolvedValueOnce([
      mockOperation1,
      mockOperation2,
    ]);

    const transaction = await getTransactionByIdUseCase.execute(
      userId,
      transactionId,
    );

    expect(transaction).toBeDefined();
    expect(transaction?.id).toBe(transactionId);
    expect(transaction?.description).toBe('Test Transaction');
    expect(mockTransactionRepository.getById).toHaveBeenCalledWith(
      userId,
      transactionId,
    );

    expect(mockEntryRepository.getByTransactionId).toHaveBeenCalledWith(
      userId,
      transactionId,
    );

    expect(mockOperationRepository.getByEntryId).toHaveBeenCalledWith(
      userId,
      mockEntry1.id,
    );
  });

  it('should throw error if transaction not found', async () => {
    const transactionId = Id.create().valueOf();
    const userId = Id.create().valueOf();

    mockTransactionRepository.getById.mockResolvedValue(null);

    await expect(
      getTransactionByIdUseCase.execute(userId, transactionId),
    ).rejects.toThrow('Transaction not found');
  });
});
