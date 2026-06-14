import {
  OperationReadModel,
  TransactionQueryRepositoryInterface,
  TransactionReadModel,
  TransactionResponseDTO,
} from 'src/application';
import { EntityNotFoundError } from 'src/application/application.errors';
import {
  Amount,
  Currency,
  DateValue,
  Id,
  Timestamp,
} from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GetTransactionByIdUseCase } from '../GetTransactionById';

describe('GetTransactionByIdUseCase', () => {
  const mockTransactionQueryRepository = {
    findById: vi.fn(),
  };

  const getTransactionByIdUseCase = new GetTransactionByIdUseCase(
    mockTransactionQueryRepository as unknown as TransactionQueryRepositoryInterface,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should retrieve transaction by ID', async () => {
    const transactionId = Id.create().valueOf();
    const userId = Id.create().valueOf();
    const createdAt = Timestamp.create().valueOf();
    const updatedAt = Timestamp.create().valueOf();

    const mockOperation1: OperationReadModel = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('1000').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 1',
      id: Id.create().valueOf(),
      isSystem: false,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
      value: Amount.create('1000').valueOf(),
    };

    const mockOperation2: OperationReadModel = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('-1000').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 2',
      id: Id.create().valueOf(),
      isSystem: false,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
      value: Amount.create('-1000').valueOf(),
    };

    const operations = [mockOperation1, mockOperation2];

    const mockTransactionData: TransactionReadModel = {
      createdAt,
      currency: Currency.create('USD').valueOf(),
      description: 'Test Transaction',
      id: transactionId,
      operations,
      postingDate: DateValue.create().valueOf(),
      transactionDate: DateValue.create().valueOf(),
      updatedAt,
      userId,
      version: 1,
    };

    mockTransactionQueryRepository.findById.mockResolvedValue(
      mockTransactionData,
    );

    const transaction = await getTransactionByIdUseCase.execute(
      userId,
      transactionId,
    );

    expect(transaction).toBeDefined();
    expect(transaction.id).toBe(transactionId);
    expect(transaction.description).toBe('Test Transaction');
    expect(transaction.version).toBe(mockTransactionData.version);
    expect(Object.keys(transaction).sort()).toEqual(
      [
        'createdAt',
        'currency',
        'description',
        'id',
        'operations',
        'postingDate',
        'transactionDate',
        'updatedAt',
        'userId',
        'version',
      ].sort(),
    );
    expect(transaction).not.toHaveProperty('isTombstone');
    expect(transaction.operations).toHaveLength(operations.length);

    transaction.operations.forEach(
      (operation: TransactionResponseDTO['operations'][number]) => {
        expect(Object.keys(operation).sort()).toEqual(
          [
            'accountId',
            'amount',
            'createdAt',
            'description',
            'id',
            'isSystem',
            'transactionId',
            'updatedAt',
            'userId',
            'value',
          ].sort(),
        );
        expect(operation).not.toHaveProperty('isTombstone');
      },
    );

    expect(mockTransactionQueryRepository.findById).toHaveBeenCalledTimes(1);
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
    ).rejects.toThrow(EntityNotFoundError);
  });
});
