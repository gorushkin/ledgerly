import { CreateEntryRequestDTO } from 'src/application';
import {
  AccountRepositoryInterface,
  EntryRepositoryInterface,
} from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { createTransaction, createUser } from 'src/db/createTestUser';
import { Account, Entry, Operation } from 'src/domain';
import { Amount, Id } from 'src/domain/domain-core';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { AccountFactory } from '..';
import { EntryFactory } from '../entry.factory';
import { OperationFactory } from '../operation.factory';

describe('EntryFactory', () => {
  let user: Awaited<ReturnType<typeof createUser>>;
  let transaction: ReturnType<typeof createTransaction>;

  let entryFactory: EntryFactory;

  let mockCreateOperationFactory: {
    createOperationsForEntry: ReturnType<typeof vi.fn>;
    preloadAccounts: ReturnType<typeof vi.fn>;
  };

  let accountFactory: {
    findOrCreateSystemAccount: ReturnType<typeof vi.fn>;
  };

  let mockEntryRepository: {
    create: ReturnType<typeof vi.fn>;
  };

  let mockAccountRepository: {
    getByIds: ReturnType<typeof vi.fn>;
  };

  let mockSaveWithIdRetry: SaveWithIdRetryType;

  const mockOperations = [{ data: 'mockData' }] as unknown as Operation[];

  beforeAll(async () => {
    user = await createUser();
    transaction = createTransaction(user);
  });

  beforeEach(() => {
    mockCreateOperationFactory = {
      createOperationsForEntry: vi.fn().mockResolvedValue(mockOperations),
      preloadAccounts: vi.fn().mockResolvedValue(new Map()),
    };

    mockEntryRepository = {
      create: vi.fn(),
    };

    accountFactory = {
      findOrCreateSystemAccount: vi.fn(),
    };

    mockAccountRepository = {
      getByIds: vi.fn(),
    };

    mockSaveWithIdRetry = vi.fn().mockResolvedValue({ name: 'mocked entry' });

    entryFactory = new EntryFactory(
      mockCreateOperationFactory as unknown as OperationFactory,
      mockEntryRepository as unknown as EntryRepositoryInterface,
      mockAccountRepository as unknown as AccountRepositoryInterface,
      accountFactory as unknown as AccountFactory,
      mockSaveWithIdRetry as unknown as SaveWithIdRetryType,
    );
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should create entries with operations', async () => {
    const mockAddOperations = vi.fn();

    const account1 = {
      accountId: Id.create().valueOf(),
      currency: 'USD',
    };

    const account2 = {
      accountId: Id.create().valueOf(),
      currency: 'USD',
    };

    const account3 = {
      accountId: Id.create().valueOf(),
      currency: 'USD',
    };

    const mockResult = {
      addOperations: mockAddOperations,
    } as unknown as Entry;

    vi.spyOn(Entry, 'create').mockReturnValue(mockResult);

    const rawEntries: CreateEntryRequestDTO[] = [
      [
        {
          accountId: account1.accountId,
          amount: Amount.create('100').valueOf(),
          description: 'Operation 1',
        },
        {
          accountId: account2.accountId,
          amount: Amount.create('-100').valueOf(),
          description: 'Operation 2',
        },
      ],
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce([account1, account2]);
    accountFactory.findOrCreateSystemAccount.mockResolvedValue(account3);

    vi.spyOn(Account, 'restore')
      .mockResolvedValueOnce(account1 as unknown as Account)
      .mockResolvedValueOnce(account2 as unknown as Account)
      .mockResolvedValueOnce(account3 as unknown as Account);

    const result = await entryFactory.createEntriesWithOperations(
      user,
      transaction,
      rawEntries,
    );

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(Entry.create).toHaveBeenCalledWith(user, transaction);

    expect(mockAddOperations).toHaveBeenCalledWith(mockOperations);

    expect(result).toEqual([mockResult]);

    expect(mockAccountRepository.getByIds).toHaveBeenCalledWith(
      user.getId().valueOf(),
      [account1.accountId, account2.accountId],
    );
  });

  it('should save entry using saveWithIdRetry', async () => {
    const account1 = {
      accountId: Id.create().valueOf(),
      currency: 'USD',
    };

    const account2 = {
      accountId: Id.create().valueOf(),
      currency: 'USD',
    };

    const account3 = {
      accountId: Id.create().valueOf(),
      currency: 'USD',
    };

    const rawEntries: CreateEntryRequestDTO[] = [
      [
        {
          accountId: account1.accountId,
          amount: Amount.create('100').valueOf(),
          description: 'Operation 1',
        },
        {
          accountId: account2.accountId,
          amount: Amount.create('-100').valueOf(),
          description: 'Operation 2',
        },
      ],
    ];

    mockAccountRepository.getByIds.mockResolvedValueOnce([account1, account2]);
    accountFactory.findOrCreateSystemAccount.mockResolvedValue(account3);

    vi.spyOn(Account, 'restore')
      .mockResolvedValueOnce(account1 as unknown as Account)
      .mockResolvedValueOnce(account2 as unknown as Account)
      .mockResolvedValueOnce(account3 as unknown as Account);

    const mockedEntries = [{ addOperations: vi.fn() }] as unknown as Entry[];

    vi.spyOn(Entry, 'create').mockReturnValueOnce(mockedEntries[0]);

    await entryFactory.createEntriesWithOperations(
      user,
      transaction,
      rawEntries,
    );

    expect(mockSaveWithIdRetry).toHaveBeenCalledTimes(rawEntries.length);

    const [[entry, repoMethod, entityFactory]] = (
      mockSaveWithIdRetry as ReturnType<typeof vi.fn>
    ).mock.calls;

    expect(entry).toBe(mockedEntries[0]);

    expect(typeof repoMethod).toBe('function');

    expect(typeof entityFactory).toBe('function');
  });
});
