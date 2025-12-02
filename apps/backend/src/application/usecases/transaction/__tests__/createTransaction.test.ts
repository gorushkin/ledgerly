import {
  IsoDatetimeString,
  UUID,
} from 'node_modules/@ledgerly/shared/src/types/types';
import {
  CreateEntryRequestDTO,
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import type { TransactionMapperInterface } from 'src/application/mappers';
import { EntryFactory } from 'src/application/services';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { createUser } from 'src/db/createTestUser';
import { Account, Entry, Transaction, User, AccountType } from 'src/domain';
import { Amount, Currency, DateValue, Name } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateTransactionUseCase } from '../CreateTransaction';

describe('CreateTransactionUseCase', () => {
  let user: User;

  const mockTransactionRepository = {
    create: vi.fn(),
    getDB: vi.fn().mockReturnValue({
      transaction: <T>(cb: (trx: unknown) => T): T => cb({}),
    }),
  };

  const mockedEntries = [
    {
      belongsToTransaction: () => true,
      getOperations: () => [
        {
          amount: Amount.create('100'),
        },
        {
          amount: Amount.create('-100'),
        },
      ],
      validateBalance: vi.fn(),
    },
  ] as unknown as Entry[];

  const entryFactory = {
    createEntriesWithOperations: vi.fn().mockResolvedValue(mockedEntries),
  };

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const transactionMapper = {
    toResponseDTO: vi.fn(),
  };

  const mockedSaveWithIdRetry = vi.fn();

  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    entryFactory as unknown as EntryFactory,
    mockedSaveWithIdRetry as unknown as SaveWithIdRetryType,
    transactionMapper as unknown as TransactionMapperInterface,
  );

  const postingDate = DateValue.restore('2024-01-01').valueOf();
  const transactionDate = DateValue.restore('2024-01-02').valueOf();
  const description = 'Test Transaction';

  let usdAccount: Account;
  let eurAccount: Account;

  beforeEach(async () => {
    user = await createUser();

    usdAccount = Account.create(
      user,
      Name.create('Test Account'),
      'Account for testing',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    eurAccount = Account.create(
      user,
      Name.create('Test Account'),
      'Account for testing',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('asset'),
    );
  });

  describe('execute', () => {
    it('should create a new transaction with entries successfully', async () => {
      const mockedResult: TransactionResponseDTO = {
        createdAt: '2024-01-01T00:00:00.000Z' as unknown as IsoDatetimeString,
        description,
        entries: [],
        id: 'transaction-id-123' as unknown as UUID,
        postingDate,
        transactionDate,
        updatedAt: '2024-01-01T00:00:00.000Z' as unknown as IsoDatetimeString,
        userId: user.getId().valueOf() as unknown as UUID,
      };

      transactionMapper.toResponseDTO.mockResolvedValue(mockedResult);

      const transaction = Transaction.create(
        user.getId(),
        description,
        DateValue.restore(postingDate),
        DateValue.restore(transactionDate),
      );

      mockedSaveWithIdRetry.mockResolvedValue(transaction);

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

      expect(result).toBe(mockedResult);

      expect(result.description).toBe(description);
      expect(result.postingDate).toBe(postingDate);
      expect(result.transactionDate).toBe(transactionDate);
      expect(result.entries).toBeDefined();

      expect(transactionManager.run).toHaveBeenCalled();

      expect(entryFactory.createEntriesWithOperations).toHaveBeenCalledWith(
        user,
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          getId: expect.any(Function),
        }),
        data.entries,
      );

      expect(transactionMapper.toResponseDTO).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          getId: expect.any(Function),
        }),
      );

      expect(mockedSaveWithIdRetry).toHaveBeenCalled();
      expect(mockedSaveWithIdRetry).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
    });
  });
});
