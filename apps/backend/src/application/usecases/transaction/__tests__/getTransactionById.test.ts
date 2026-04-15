import {
  EntityNotFoundError,
  TransactionResponseDTO,
  TransactionQueryRepositoryInterface,
} from 'src/application';
import { OperationDbRow, TransactionWithRelations } from 'src/db/schema';
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

    const mockOperation1: OperationDbRow = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('1000').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 1',
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
      value: Amount.create('1000').valueOf(),
    };

    const mockOperation2: OperationDbRow = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('-1000').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Operation 2',
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: false,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
      value: Amount.create('-1000').valueOf(),
    };

    const mockOperation3: OperationDbRow = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('500').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Deleted Operation 1',
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: true,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
      value: Amount.create('500').valueOf(),
    };

    const mockOperation4: OperationDbRow = {
      accountId: Id.create().valueOf(),
      amount: Amount.create('-500').valueOf(),
      createdAt: Timestamp.create().valueOf(),
      description: 'Deleted Operation 2',
      id: Id.create().valueOf(),
      isSystem: false,
      isTombstone: true,
      transactionId,
      updatedAt: Timestamp.create().valueOf(),
      userId,
      value: Amount.create('-500').valueOf(),
    };

    const deletedOperations = [mockOperation3, mockOperation4];
    const nonDeletedOperations = [mockOperation1, mockOperation2];

    const mockTransactionData: TransactionWithRelations = {
      createdAt,
      currency: Currency.create('USD').valueOf(),
      description: 'Test Transaction',
      id: transactionId,
      isTombstone: false,
      operations: [...deletedOperations, ...nonDeletedOperations],
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
    expect(transaction).not.toHaveProperty('isTombstone');
    expect(transaction.operations).toHaveLength(nonDeletedOperations.length);

    transaction.operations.forEach(
      (operation: TransactionResponseDTO['operations'][number]) => {
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
