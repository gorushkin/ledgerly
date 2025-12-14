import {
  AccountRepositoryInterface,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionWithRelations } from 'src/db/schema';
import { Id } from 'src/domain/domain-core';
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

  it('should retrieve transactions by account ID', async () => {
    const mockTransactions = [] as TransactionWithRelations[];

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
    expect(result).toBe(mockTransactions);
  });

  it('should return an empty array if no transactions are found', async () => {
    transactionQueryRepository.findAll.mockResolvedValue([]);

    const result = await getAllTransactionsUseCase.execute(userId, {
      accountId,
    });

    expect(transactionQueryRepository.findAll).toHaveBeenCalledWith(userId, {
      accountId,
    });
    expect(result).toEqual([]);
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
