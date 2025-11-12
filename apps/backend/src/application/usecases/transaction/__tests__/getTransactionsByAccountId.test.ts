import { TransactionRepositoryInterface } from 'src/application/interfaces';
import { TransactionWithRelations } from 'src/db/schema';
import { Id } from 'src/domain/domain-core';
import { describe, expect, it, vi } from 'vitest';

import { GetTransactionsByAccountIdUseCase } from '../GetTransactionsByAccountId';

describe('GetTransactionsByAccountIdUseCase', () => {
  const userId = Id.create().valueOf();
  const accountId = Id.create().valueOf();
  const transactionRepository = {
    getByAccountId: vi.fn(),
  };

  const getTransactionsByAccountIdUseCase =
    new GetTransactionsByAccountIdUseCase(
      transactionRepository as unknown as TransactionRepositoryInterface,
    );

  it('should retrieve transactions by account ID', async () => {
    const mockTransactions = [] as TransactionWithRelations[];

    transactionRepository.getByAccountId.mockResolvedValue(mockTransactions);

    const result = await getTransactionsByAccountIdUseCase.execute(
      userId,
      accountId,
    );

    expect(transactionRepository.getByAccountId).toHaveBeenCalledWith(
      userId,
      accountId,
    );
    expect(result).toBe(mockTransactions);
  });

  it('should return an empty array if no transactions are found', async () => {
    transactionRepository.getByAccountId.mockResolvedValue([]);

    const result = await getTransactionsByAccountIdUseCase.execute(
      userId,
      accountId,
    );

    expect(transactionRepository.getByAccountId).toHaveBeenCalledWith(
      userId,
      accountId,
    );
    expect(result).toEqual([]);
  });
});
