import { CreateEntryRequestDTO } from 'src/application';
import {
  AccountRepositoryInterface,
  EntryRepositoryInterface,
} from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { createTransaction, createUser } from 'src/db/createTestUser';
import { Account, Entry, Operation } from 'src/domain';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { AccountFactory } from '..';
import { EntryFactory } from '../entry.factory';
import { OperationFactory } from '../operation.factory';

describe('EntryFactory', () => {
  let user: Awaited<ReturnType<typeof createUser>>;
  let transaction: ReturnType<typeof createTransaction>;

  const accountFactory = {
    findOrCreateSystemAccount: vi.fn(),
  };

  const mockEntryRepository = {
    create: vi.fn(),
  };

  const mockAccountRepository = {
    getByIds: vi.fn(),
  };

  const mockSaveWithIdRetry = vi.fn();

  const mockCreateOperationFactory = {
    createOperationsForEntry: vi.fn(),
    preloadAccounts: vi.fn(),
  };

  const entryFactory = new EntryFactory(
    mockCreateOperationFactory as unknown as OperationFactory,
    mockEntryRepository as unknown as EntryRepositoryInterface,
    mockAccountRepository as unknown as AccountRepositoryInterface,
    accountFactory as unknown as AccountFactory,
    mockSaveWithIdRetry as unknown as SaveWithIdRetryType,
  );

  let account1: Account;
  let account2: Account;
  let account3: Account;

  let mockEntry: Entry;
  let operationFrom: Operation;
  let operationTo: Operation;

  beforeAll(async () => {
    user = await createUser();
    transaction = createTransaction(user);

    account1 = Account.create(
      user,
      Name.create('Personal USD Account'),
      'Personal USD Account',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    account2 = Account.create(
      user,
      Name.create('Second USD Account'),
      'Second USD Account',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    account3 = Account.create(
      user,
      Name.create('System USD Account'),
      'System USD Account',
      Amount.create('0'),
      Currency.create('USD'),
      AccountType.create('asset'),
    );

    mockEntry = Entry.create(user, transaction);

    operationFrom = Operation.create(
      user,
      account1,
      mockEntry,
      Amount.create('-100'),
      'Operation 1 description',
    );

    operationTo = Operation.create(
      user,
      account2,
      mockEntry,
      Amount.create('100'),
      'Operation 2 description',
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create entries with operations', async () => {
    const mockOperations = [operationFrom, operationTo];

    const rawEntries: CreateEntryRequestDTO[] = [
      [
        {
          accountId: account1.getId().valueOf(),
          amount: Amount.create('100').valueOf(),
          description: 'Operation 1',
        },
        {
          accountId: account2.getId().valueOf(),
          amount: Amount.create('-100').valueOf(),
          description: 'Operation 2',
        },
      ],
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce([
      account1.toPersistence(),
      account2.toPersistence(),
    ]);

    accountFactory.findOrCreateSystemAccount.mockResolvedValue(account3);

    mockSaveWithIdRetry.mockResolvedValue(mockEntry);

    mockCreateOperationFactory.createOperationsForEntry.mockResolvedValue(
      mockOperations,
    );

    const result = await entryFactory.createEntriesWithOperations(
      user,
      transaction,
      rawEntries,
    );

    expect(result).toHaveLength(1);

    const entry = result[0];

    expect(entry).toBeInstanceOf(Entry);

    expect(entry).toBe(mockEntry);
    expect(entry.getOperations()).toEqual(mockOperations);
    expect(mockSaveWithIdRetry).toHaveBeenCalledTimes(rawEntries.length);

    mockSaveWithIdRetry.mock.calls.forEach(
      ([repoMethodArg, entityFactoryArg]) => {
        expect(typeof repoMethodArg).toBe('function');
        expect(typeof entityFactoryArg).toBe('function');
      },
    );
  });
});
