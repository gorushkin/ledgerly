import {
  CurrencyCode,
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
import { EntriesContextLoader } from 'src/application/services/EntriesService';
import { EntryContext } from 'src/application/services/EntriesService/entries.updater';
import { createUser } from 'src/db/createTestUser';
import { Account, User, AccountType } from 'src/domain';
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

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const transactionMapper = {
    toResponseDTO: vi.fn(),
  };

  const entriesContextLoader = {
    loadForEntries: vi.fn(),
  };

  const createTransactionUseCase = new CreateTransactionUseCase(
    transactionManager as unknown as TransactionManagerInterface,
    mockTransactionRepository as unknown as TransactionRepositoryInterface,
    transactionMapper as unknown as TransactionMapperInterface,
    entriesContextLoader as unknown as EntriesContextLoader,
  );

  const postingDate = DateValue.restore('2024-01-01').valueOf();
  const transactionDate = DateValue.restore('2024-01-02').valueOf();
  const description = 'Test Transaction';

  let entries: CreateEntryRequestDTO[];

  let entryContext: EntryContext;

  beforeEach(async () => {
    user = await createUser();

    const usdAccount = Account.create(
      user,
      Name.create('USD Account'),
      'USD',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    const eurAccount = Account.create(
      user,
      Name.create('EUR Account'),
      'EUR',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('asset'),
    );

    const usdSystemAccount = Account.create(
      user,
      Name.create('USD System Account'),
      'System account for USD exchanges',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('liability'),
    );

    const eurSystemAccount = Account.create(
      user,
      Name.create('EUR System Account'),
      'System account for EUR exchanges',
      Amount.create('0'),
      Currency.create('EUR'),
      AccountType.create('liability'),
    );

    entryContext = {
      accountsMap: new Map<UUID, Account>([
        [usdAccount.getId().valueOf(), usdAccount],
        [eurAccount.getId().valueOf(), eurAccount],
      ]),
      systemAccountsMap: new Map<CurrencyCode, Account>([
        [usdSystemAccount.getCurrency().valueOf(), usdSystemAccount],
        [eurSystemAccount.getCurrency().valueOf(), eurSystemAccount],
      ]),
    };

    entries = [
      {
        description: 'Sample Entry',
        operations: [
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('-200').valueOf(),
            description: 'Credit operation',
          },
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Debit operation',
          },
        ],
      },
    ];
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

      const transactionDTO: CreateTransactionRequestDTO = {
        description,
        entries,
        postingDate,
        transactionDate,
      };

      transactionMapper.toResponseDTO.mockResolvedValue(mockedResult);
      entriesContextLoader.loadForEntries.mockResolvedValue(entryContext);

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

      expect(transactionMapper.toResponseDTO).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          getId: expect.any(Function),
        }),
      );

      expect(entriesContextLoader.loadForEntries).toHaveBeenCalled();
      expect(entriesContextLoader.loadForEntries).toHaveBeenCalledWith(
        user,
        transactionDTO.entries,
      );
    });
  });
});
