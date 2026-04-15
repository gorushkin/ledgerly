import { UUID } from '@ledgerly/shared/types';
import { TransactionResponseDTO } from 'src/application/dto';
import {
  AccountRepositoryInterface,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';
import { OperationDbRow, TransactionWithRelations } from 'src/db/schema';
import {
  Amount,
  Currency,
  DateValue,
  Id,
  Timestamp,
} from 'src/domain/domain-core';
import { ForbiddenAccessError } from 'src/infrastructure/infrastructure.errors';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { GetAllTransactionsUseCase } from '../GetAllTransactions';

describe('GetAllTransactionsUseCase', () => {
  const userId = Id.create().valueOf();
  const accountId = Id.create().valueOf();
  const transactionQueryRepository = {
    findAll: vi.fn(),
  };

  const accountRepository = {
    ensureUserOwnsAccount: vi.fn(),
  };

  const getAllTransactionsUseCase = new GetAllTransactionsUseCase(
    transactionQueryRepository as unknown as TransactionQueryRepositoryInterface,
    accountRepository as unknown as AccountRepositoryInterface,
  );

  afterEach(() => {
    vi.clearAllMocks();
  });

  const buildOperation = (
    transactionId: UUID,
    userId: UUID,
    overrides?: Partial<OperationDbRow>,
  ): OperationDbRow => ({
    accountId: Id.create().valueOf(),
    amount: Amount.create('100').valueOf(),
    createdAt: Timestamp.create().valueOf(),
    description: 'Operation',
    id: Id.create().valueOf(),
    isSystem: false,
    isTombstone: false,
    transactionId,
    updatedAt: Timestamp.create().valueOf(),
    userId,
    value: Amount.create('100').valueOf(),
    ...overrides,
  });

  const buildTransaction = (): TransactionWithRelations => {
    const transactionId = Id.create().valueOf();

    return {
      createdAt: Timestamp.create().valueOf(),
      currency: Currency.create('USD').valueOf(),
      description: 'Test transaction',
      id: transactionId,
      isTombstone: false,
      operations: [buildOperation(transactionId, userId)],
      postingDate: DateValue.restore('2024-01-01').valueOf(),
      transactionDate: DateValue.restore('2024-01-01').valueOf(),
      updatedAt: Timestamp.create().valueOf(),
      userId,
      version: 1,
    };
  };

  it('should retrieve transactions by account ID', async () => {
    const mockTransactions = [buildTransaction()];

    transactionQueryRepository.findAll.mockResolvedValue(mockTransactions);

    const result = await getAllTransactionsUseCase.execute(userId, {
      accountId,
    });

    expect(accountRepository.ensureUserOwnsAccount).toHaveBeenCalledWith(
      userId,
      accountId,
    );
    expect(transactionQueryRepository.findAll).toHaveBeenCalledWith(userId, {
      accountId,
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockTransactions[0].id);
    expect(result[0]).not.toHaveProperty('isTombstone');
    result[0].operations.forEach(
      (operation: TransactionResponseDTO['operations'][number]) => {
        expect(operation).not.toHaveProperty('isTombstone');
      },
    );
  });

  it('should retrieve all transactions without account ownership check when accountId is not provided', async () => {
    const mockTransactions = [buildTransaction()];

    transactionQueryRepository.findAll.mockResolvedValue(mockTransactions);

    const result = await getAllTransactionsUseCase.execute(userId);

    expect(accountRepository.ensureUserOwnsAccount).not.toHaveBeenCalled();
    expect(transactionQueryRepository.findAll).toHaveBeenCalledWith(
      userId,
      undefined,
    );
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(mockTransactions[0].id);
    expect(result[0]).not.toHaveProperty('isTombstone');
  });

  it('should throw an error if user does not own the account', async () => {
    accountRepository.ensureUserOwnsAccount.mockRejectedValue(
      new ForbiddenAccessError(
        'You do not have permission to access this account',
      ),
    );

    await expect(
      getAllTransactionsUseCase.execute(userId, {
        accountId,
      }),
    ).rejects.toThrow('You do not have permission to access this account');

    expect(accountRepository.ensureUserOwnsAccount).toHaveBeenCalledWith(
      userId,
      accountId,
    );

    expect(transactionQueryRepository.findAll).not.toHaveBeenCalled();
  });
});
