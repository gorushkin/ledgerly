import {
  EntryCreateInput,
  TransactionCreateInput,
} from '@ledgerly/shared/validation';
import { UpdateTransactionRequestDTO } from 'src/application';
import { CreateTransactionUseCase } from 'src/application/usecases/transaction/CreateTransaction';
import { GetAllTransactionsUseCase } from 'src/application/usecases/transaction/GetAllTransactions';
import { GetTransactionByIdUseCase } from 'src/application/usecases/transaction/GetTransactionById';
import { UpdateTransactionUseCase } from 'src/application/usecases/transaction/UpdateTransaction';
import { User } from 'src/domain';
import { Amount, DateValue, Id } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';

import { createUser } from '../helpers';

import { TransactionController } from './transaction.controller';

describe('TransactionController', () => {
  let user: User;

  const mockTransaction = { data: 'mockTransaction' };
  const mockTransactions = [{ data: 'mockTransaction' }];

  const mockCreateTransactionUseCase = {
    execute: vi.fn().mockResolvedValue(mockTransaction),
  };

  const mockGetTransactionByIdUseCase = {
    execute: vi.fn().mockResolvedValue(mockTransaction),
  };

  const mockGetAllTransactionsUseCase = {
    execute: vi.fn().mockResolvedValue(mockTransactions),
  };

  const mockUpdateTransactionUseCase = {
    execute: vi.fn().mockResolvedValue(mockTransaction),
  };

  const operationFrom = {
    accountId: Id.create().valueOf(),
    amount: Amount.create('-100').valueOf(),
    description: 'Test Operation From',
  };

  const operationTo = {
    accountId: Id.create().valueOf(),
    amount: Amount.create('100').valueOf(),
    description: 'Test Operation To',
  };

  const entries: EntryCreateInput[] = [
    { description: 'Test Entry', operations: [operationFrom, operationTo] },
  ];

  const transactionController = new TransactionController(
    mockCreateTransactionUseCase as unknown as CreateTransactionUseCase,
    mockGetTransactionByIdUseCase as unknown as GetTransactionByIdUseCase,
    mockGetAllTransactionsUseCase as unknown as GetAllTransactionsUseCase,
    mockUpdateTransactionUseCase as unknown as UpdateTransactionUseCase,
  );

  beforeEach(async () => {
    user = await createUser();
  });

  describe('create', () => {
    it('should call CreateTransactionUseCase with correct parameters', async () => {
      const requestBody: TransactionCreateInput = {
        description: 'Test Transaction',
        entries,
        postingDate: DateValue.restore('2024-01-01').valueOf(),
        transactionDate: DateValue.restore('2024-01-02').valueOf(),
      };

      const result = await transactionController.create(user, requestBody);

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

      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getById', () => {
    it('should call GetTransactionByIdUseCase with correct parameters', async () => {
      const transactionId = Id.create().valueOf();

      const result = await transactionController.getById(user, transactionId);

      expect(mockGetTransactionByIdUseCase.execute).toHaveBeenCalledWith(
        user.id,
        transactionId,
      );

      expect(mockGetTransactionByIdUseCase.execute).toHaveBeenCalledTimes(1);

      expect(result).equals(mockTransaction);
    });
  });

  describe('getAll', () => {
    it('should call GetAllTransactionsUseCase with correct parameters', async () => {
      const accountId = Id.create().valueOf();

      mockGetAllTransactionsUseCase.execute.mockResolvedValue([
        mockTransaction,
      ]);

      const result = await transactionController.getAll(user, {
        accountId,
      });

      expect(mockGetAllTransactionsUseCase.execute).toHaveBeenCalledWith(
        user.id,
        { accountId },
      );

      expect(mockGetAllTransactionsUseCase.execute).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockTransactions);
    });
  });

  describe('update', () => {
    it('should call UpdateTransactionUseCase with correct parameters', async () => {
      const transactionId = Id.create().valueOf();

      const requestBody: UpdateTransactionRequestDTO = {
        description: 'Updated Transaction',
        entries: {
          create: [],
          delete: [],
          update: [
            {
              description: 'Test Entry',
              id: Id.create().valueOf(),
              operations: [
                {
                  accountId: operationFrom.accountId,
                  amount: operationFrom.amount,
                  description: operationFrom.description,
                  entryId: Id.create().valueOf(),
                  id: Id.create().valueOf(),
                },
                {
                  accountId: operationFrom.accountId,
                  amount: operationFrom.amount,
                  description: operationFrom.description,
                  entryId: Id.create().valueOf(),
                  id: Id.create().valueOf(),
                },
              ],
            },
          ],
        },
        postingDate: DateValue.restore('2024-01-01').valueOf(),
        transactionDate: DateValue.restore('2024-01-02').valueOf(),
      };

      const result = await transactionController.update(
        user,
        transactionId,
        requestBody as unknown as UpdateTransactionRequestDTO,
      );

      expect(mockUpdateTransactionUseCase.execute).toHaveBeenCalledWith(
        user,
        transactionId,
        expect.objectContaining({
          description: requestBody.description,
          entries: requestBody.entries,
          postingDate: requestBody.postingDate,
          transactionDate: requestBody.transactionDate,
        }),
      );

      expect(mockUpdateTransactionUseCase.execute).toHaveBeenCalledTimes(1);

      expect(result).toEqual(mockTransaction);
    });

    it('should throw validation error for invalid data', async () => {
      const transactionId = Id.create().valueOf();

      const invalidRequestBody = {
        description: 'Updated Transaction',
        entries: [],
        postingDate: 'invalid-date',
        transactionDate: '2024-01-02',
      };

      await expect(
        transactionController.update(
          user,
          transactionId,
          invalidRequestBody as unknown as UpdateTransactionRequestDTO,
        ),
      ).rejects.toThrow(ZodError);
    });
  });
});
