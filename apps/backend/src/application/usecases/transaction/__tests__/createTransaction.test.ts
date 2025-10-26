import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { createUser } from 'src/db/createTestUser';
import { Account, Entry } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';
import { Transaction } from 'src/domain/transactions';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', async () => {
  const user = await createUser();

  let createTransactionUseCase: CreateTransactionUseCase;

  let mockTransactionRepository: {
    create: ReturnType<typeof vi.fn>;
    getDB: ReturnType<typeof vi.fn>;
  };

  let mockEntryRepository: {
    create: ReturnType<typeof vi.fn>;
    getDB: ReturnType<typeof vi.fn>;
  };

  let mockOperationRepository: {
    create: ReturnType<typeof vi.fn>;
    getDB: ReturnType<typeof vi.fn>;
  };

  let transactionManager: { run: ReturnType<typeof vi.fn> };
  let mockAccountRepository: { getById: ReturnType<typeof vi.fn> };

  const transactionIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const postingDate = DateValue.restore('2024-01-01').valueOf();
  const transactionDate = DateValue.restore('2024-01-02').valueOf();
  const description = 'Test Transaction';

  const account = Account.create(
    user.getId(),
    Name.create('Test Account'),
    'Account for testing',
    Amount.create('0'),
    Currency.create('USD'),
    AccountType.create('asset'),
  );

  const mockSavedTransactionData = {
    createdAt: new Date().toISOString(),
    description,
    id: transactionIdValue,
    isTombstone: false,
    postingDate,
    transactionDate,
    updatedAt: new Date().toISOString(),
    userId: user.id,
  };

  const mockedSaveWithIdRetry = vi
    .fn()
    .mockResolvedValue({ name: 'mocked account' }); // Mock implementation

  beforeEach(() => {
    mockTransactionRepository = {
      create: vi.fn(),
      getDB: vi.fn().mockReturnValue({
        transaction: <T>(cb: (trx: unknown) => T): T => cb({}),
      }),
    };

    mockEntryRepository = {
      create: vi.fn(),
      getDB: vi.fn().mockReturnValue({
        transaction: <T>(cb: (trx: unknown) => T): T => cb({}),
      }),
    };

    mockOperationRepository = {
      create: vi.fn(),
      getDB: vi.fn().mockReturnValue({
        transaction: <T>(cb: (trx: unknown) => T): T => cb({}),
      }),
    };

    mockAccountRepository = {
      getById: vi.fn().mockResolvedValue(account),
    };

    transactionManager = {
      run: vi.fn((cb: () => unknown) => {
        return cb();
      }),
    };

    createTransactionUseCase = new CreateTransactionUseCase(
      transactionManager as unknown as TransactionManagerInterface,
      mockTransactionRepository as unknown as TransactionRepositoryInterface,
      mockEntryRepository as unknown as EntryRepositoryInterface,
      mockOperationRepository as unknown as OperationRepositoryInterface,
      mockAccountRepository as unknown as AccountRepository,
      mockedSaveWithIdRetry,
    );
  });
  describe('execute', () => {
    it('should create a new transaction with entries successfully', async () => {
      const expectedResult = {
        ...mockSavedTransactionData,
        isTombstone: false,
      };

      mockedSaveWithIdRetry.mockResolvedValue(expectedResult);

      const addEntry = vi.fn();

      const mockedTransaction = {
        addEntry,
        getId: () => transactionIdValue,
        toResponseDTO: () => expectedResult,
        validateBalance: vi.fn(),
      } as unknown as Transaction;

      const mockedEntry = {
        addOperation: vi.fn(),
        getId: () => 'some-entry-id',
      } as unknown as Entry;

      vi.spyOn(Account, 'restore').mockReturnValue(account);
      vi.spyOn(Transaction, 'create').mockReturnValue(mockedTransaction);
      vi.spyOn(Entry, 'create').mockReturnValue(mockedEntry);

      const entries = [
        {
          operations: [
            {
              accountId: account.getId().valueOf(),
              amount: Amount.create('100').valueOf(),
              description: 'Operation 1',
            },
            {
              accountId: account.getId().valueOf(),
              amount: Amount.create('100').valueOf(),
              description: 'Operation 1',
            },
          ],
        },
      ];

      const data = {
        description,
        entries,
        postingDate,
        transactionDate,
      };

      const result = await createTransactionUseCase.execute(user, data);

      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        mockedTransaction,
        expect.any(Function),
        expect.any(Function),
      );

      expect(addEntry).toHaveBeenCalledTimes(entries.length);
      expect(addEntry).toHaveBeenCalledWith(mockedEntry);

      expect(result).toEqual(expectedResult);
    });
  });
});
