import { TransactionQueryRepositoryInterface } from 'src/application';
import {
  EntryWithOperations,
  OperationDbRow,
  TransactionWithRelations,
} from 'src/db/schema';
import { Amount, DateValue, Id, Timestamp } from 'src/domain/domain-core';
import { describe, expect, it, vi } from 'vitest';

import { GetTransactionByIdUseCase } from '../GetTransactionById';

describe('GetTransactionByIdUseCase', () => {
  const mockTransactionQueryRepository = {
    findById: vi.fn(),
  };

  const getTransactionByIdUseCase = new GetTransactionByIdUseCase(
    mockTransactionQueryRepository as unknown as TransactionQueryRepositoryInterface,
  );

  it('should retrieve transaction by ID', async () => {
    const transactionId = Id.create().valueOf();
    const userId = Id.create().valueOf();
    const entryId = Id.create().valueOf();
    const createdAt = Timestamp.create().valueOf();
    const updatedAt = Timestamp.create().valueOf();

    const mockOperation1: OperationDbRow = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('1000').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 1',
      entryId,
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      updatedAt: Timestamp.create().valueOf(),
      userId,
    };

    const mockOperation2: OperationDbRow = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('500').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 2',
      entryId,
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      updatedAt: Timestamp.create().valueOf(),
      userId,
    };

    const mockEntry1: EntryWithOperations = {
      createdAt: Timestamp.create().valueOf(),
      description: 'Test Entry',
      id: entryId,
      isTombstone: false,
      operations: [mockOperation1, mockOperation2],
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
    };

    const mockTransactionData: TransactionWithRelations = {
      createdAt,
      description: 'Test Transaction',
      entries: [mockEntry1],
      id: transactionId,
      isTombstone: false,
      postingDate: DateValue.create().valueOf(),
      transactionDate: DateValue.create().valueOf(),
      updatedAt,
      userId,
    };

    mockTransactionQueryRepository.findById.mockResolvedValue(
      mockTransactionData,
    );

    const transaction = await getTransactionByIdUseCase.execute(
      userId,
      transactionId,
    );

    expect(transaction).toBeDefined();
    expect(transaction?.id).toBe(transactionId);
    expect(transaction?.description).toBe('Test Transaction');
    expect(mockTransactionQueryRepository.findById).toHaveBeenCalledWith(
      userId,
      transactionId,
    );
  });

  it('should throw error if transaction not found', async () => {
    const transactionId = Id.create().valueOf();
    const userId = Id.create().valueOf();

    mockTransactionQueryRepository.findById.mockResolvedValue(null);

    await expect(
      getTransactionByIdUseCase.execute(userId, transactionId),
    ).rejects.toThrow('Transaction not found');
  });
});
