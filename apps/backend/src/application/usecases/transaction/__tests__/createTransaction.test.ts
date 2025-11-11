import {
  CreateEntryRequestDTO,
  CreateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { EntryFactory, OperationFactory } from 'src/application/services';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { createUser } from 'src/db/createTestUser';
import { Account, Entry } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';
import { Transaction } from 'src/domain/transactions';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', async () => {
  const user = await createUser();

  let createTransactionUseCase: CreateTransactionUseCase;

  let mockTransactionRepository: {
    create: ReturnType<typeof vi.fn>;
    getDB: ReturnType<typeof vi.fn>;
  };

  let entryFactory: {
    createEntriesWithOperations: ReturnType<typeof vi.fn>;
  };

  let operationFactory: {
    createOperationsForEntry: ReturnType<typeof vi.fn>;
  };

  let transactionManager: { run: ReturnType<typeof vi.fn> };

  const transactionIdValue = '660e8400-e29b-41d4-a716-446655440001';

  const postingDate = DateValue.restore('2024-01-01').valueOf();
  const transactionDate = DateValue.restore('2024-01-02').valueOf();
  const description = 'Test Transaction';

  const usdAccount = Account.create(
    user,
    Name.create('Test Account'),
    'Account for testing',
    Amount.create('0'),
    Currency.create('USD'),
    AccountType.create('asset'),
  );

  const eurAccount = Account.create(
    user,
    Name.create('Test Account'),
    'Account for testing',
    Amount.create('0'),
    Currency.create('EUR'),
    AccountType.create('asset'),
  );

  const mockedEntries = [
    {
      getCreatedAt: () => ({ valueOf: () => '2024-01-01T00:00:00Z' }),
      getId: () => ({ valueOf: () => 'some-entry-id-1' }),
      getOperations: () => [
        {
          amount: { valueOf: () => '100' },
          description: 'Operation 1',
          getAccountId: () => ({ valueOf: () => usdAccount.getId().valueOf() }),
          getCreatedAt: () => ({ valueOf: () => '2024-01-01T00:00:00Z' }),
          getUpdatedAt: () => ({ valueOf: () => '2024-01-01T00:00:00Z' }),
          getUserId: () => ({ valueOf: () => user.getId().valueOf() }),
          id: { valueOf: () => 'operation-id-1' },
          isSystem: false,
        },
        {
          amount: { valueOf: () => '100' },
          description: 'Operation 2',
          getAccountId: () => ({ valueOf: () => eurAccount.getId().valueOf() }),
          getCreatedAt: () => ({ valueOf: () => '2024-01-01T00:00:00Z' }),
          getUpdatedAt: () => ({ valueOf: () => '2024-01-01T00:00:00Z' }),
          getUserId: () => ({ valueOf: () => user.getId().valueOf() }),
          id: { valueOf: () => 'operation-id-2' },
          isSystem: false,
        },
      ],
      getTransactionId: () => ({ valueOf: () => transactionIdValue.valueOf() }),
      getUpdatedAt: () => ({ valueOf: () => '2024-01-01T00:00:00Z' }),
      id: 'some-entry-id-1',
      operations: [],
      toPersistence: () => ({
        createdAt: '2024-01-01T00:00:00Z',
        id: 'some-entry-id-1',
        transactionId: transactionIdValue.valueOf(),
        updatedAt: '2024-01-01T00:00:00Z',
        userId: user.getId().valueOf(),
      }),
    },
  ] as unknown as Entry[];

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

    entryFactory = {
      createEntriesWithOperations: vi.fn().mockReturnValue(mockedEntries),
    };

    operationFactory = {
      createOperationsForEntry: vi.fn(),
    };

    transactionManager = {
      run: vi.fn((cb: () => unknown) => {
        return cb();
      }),
    };

    createTransactionUseCase = new CreateTransactionUseCase(
      transactionManager as unknown as TransactionManagerInterface,
      mockTransactionRepository as unknown as TransactionRepositoryInterface,
      entryFactory as unknown as EntryFactory,
      operationFactory as unknown as OperationFactory,
      mockedSaveWithIdRetry as unknown as SaveWithIdRetryType,
    );
  });

  describe('execute', () => {
    it('should create a new transaction with entries successfully', async () => {
      const mockedSaveWithIdRetryResult = {
        data: 'mockedSaveWithIdRetryResult',
      };

      mockedSaveWithIdRetry.mockResolvedValue(mockedSaveWithIdRetryResult);

      const mockAddEntry = vi.fn();
      const mockValidateBalance = vi.fn();
      const mockGetCreatedAt = vi
        .fn()
        .mockReturnValue({ valueOf: () => '2024-01-01T00:00:00Z' });
      const mockGetUpdatedAt = vi
        .fn()
        .mockReturnValue({ valueOf: () => '2024-01-01T00:00:00Z' });
      const mockGetPostingDate = vi
        .fn()
        .mockReturnValue({ valueOf: () => postingDate });
      const mockGetTransactionDate = vi
        .fn()
        .mockReturnValue({ valueOf: () => transactionDate });
      const mockGetUserId = vi
        .fn()
        .mockReturnValue({ valueOf: () => user.getId().valueOf() });
      const mockGetEntries = vi.fn().mockReturnValue(mockedEntries);

      const mockedTransaction = {
        addEntry: mockAddEntry,
        description,
        getCreatedAt: mockGetCreatedAt,
        getEntries: mockGetEntries,
        getId: () => transactionIdValue,
        getPostingDate: mockGetPostingDate,
        getTransactionDate: mockGetTransactionDate,
        getUpdatedAt: mockGetUpdatedAt,
        getUserId: mockGetUserId,
        validateBalance: mockValidateBalance,
      } as unknown as Transaction;

      const mockedEntry = {
        addOperations: vi.fn(),
        getId: () => 'some-entry-id',
      } as unknown as Entry;

      vi.spyOn(Account, 'restore').mockReturnValue(usdAccount);
      vi.spyOn(Transaction, 'create').mockReturnValue(mockedTransaction);
      vi.spyOn(Entry, 'create').mockReturnValue(mockedEntry);

      const entries: CreateEntryRequestDTO[] = [
        [
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Operation 1',
          },
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Operation 1',
          },
        ],
      ];

      const data: CreateTransactionRequestDTO = {
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

      expect(mockAddEntry).toHaveBeenCalledTimes(mockedEntries.length);

      mockAddEntry.mock.calls.forEach((call, index) => {
        expect(call[0]).toEqual(mockedEntries[index]);
      });

      expect(mockValidateBalance).toHaveBeenCalled();

      expect(result).toMatchObject({
        description,
        id: transactionIdValue.valueOf(),
        postingDate,
        transactionDate,
        userId: user.getId().valueOf(),
      });
      expect(result.entries).toHaveLength(1);
    });
  });
});
