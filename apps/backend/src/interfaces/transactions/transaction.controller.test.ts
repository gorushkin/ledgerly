import { CreateTransactionRequestDTO } from 'src/application';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { User } from 'src/domain';
import { Id } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createUser } from '../helpers';

import { TransactionController } from './transaction.controller';

describe('TransactionController', () => {
  let user: User;

  const mockTransaction = { data: 'mockTransaction' };

  const mockCreateTransactionUseCase = {
    execute: vi.fn().mockResolvedValue(mockTransaction),
  };

  const transactionController = new TransactionController(
    mockCreateTransactionUseCase as unknown as CreateTransactionUseCase,
  );

  beforeEach(async () => {
    user = await createUser();
  });

  describe('create', () => {
    it('should call CreateTransactionUseCase with correct parameters', async () => {
      const operationFrom = {
        accountId: Id.create().valueOf(),
        amount: '-100',
        description: 'Test Operation From',
      };

      const operationTo = {
        accountId: Id.create().valueOf(),
        amount: '100',
        description: 'Test Operation To',
      };

      const entries = [[operationFrom, operationTo]];

      const requestBody = {
        description: 'Test Transaction',
        entries,
        postingDate: '2024-01-01',
        transactionDate: '2024-01-02',
      };

      const result = await transactionController.create(
        user,
        requestBody as unknown as CreateTransactionRequestDTO,
      );

      expect(mockCreateTransactionUseCase.execute).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          description: 'Test Transaction',
          entries,
          postingDate: '2024-01-01',
          transactionDate: '2024-01-02',
        }),
      );

      expect(mockCreateTransactionUseCase.execute).toHaveBeenCalledTimes(1);

      expect(result).equals(mockTransaction);
    });
  });
});
