import { CreateEntryRequestDTO } from 'src/application';
import {
  AccountRepositoryInterface,
  EntryRepositoryInterface,
  OperationRepositoryInterface,
} from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { createTransaction, createUser } from 'src/db/createTestUser';
import { Account, Entry, Operation } from 'src/domain';
import { AccountType } from 'src/domain/';
import { Amount, Currency, Name } from 'src/domain/domain-core';
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

  const accountFactory = {
    findOrCreateSystemAccount: vi.fn(),
  };

  const mockEntryRepository = {
    create: vi.fn(),
    deleteByTransactionId: vi.fn(),
  };

  const mockAccountRepository = {
    getByIds: vi.fn(),
  };

  const mockOperationRepository = {
    deleteByEntryIds: vi.fn(),
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
    mockOperationRepository as unknown as OperationRepositoryInterface,
  );

  let account1: Account;
  let account2: Account;
  let account3: Account;

  let mockEntry: Entry;

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
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  beforeEach(() => {
    mockEntry = Entry.create(user, transaction, 'Mock Entry 1');
  });

  describe('createEntryWithOperations', () => {
    it('should create entries with operations', async () => {
      const operationFrom = Operation.create(
        user,
        account1,
        mockEntry,
        Amount.create('-100'),
        'Operation 1 description',
      );

      const operationTo = Operation.create(
        user,
        account2,
        mockEntry,
        Amount.create('100'),
        'Operation 2 description',
      );

      const mockOperations = [operationFrom, operationTo];

      const rawEntries: CreateEntryRequestDTO[] = [
        {
          description: mockEntry.description,
          operations: [
            {
              accountId: operationFrom.getAccountId().valueOf(),
              amount: operationFrom.amount.valueOf(),
              description: operationFrom.description,
            },
            {
              accountId: operationTo.getAccountId().valueOf(),
              amount: operationTo.amount.valueOf(),
              description: operationTo.description,
            },
          ],
        },
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

      expect(result).toHaveLength(rawEntries.length);

      const checkedEntries = new Set(rawEntries.map((e) => e.description));

      result.forEach((entry) => {
        const rawEntry = rawEntries.find((e) => {
          return e.description === entry.description;
        });

        if (rawEntry) {
          checkedEntries.delete(rawEntry.description);
          expect(entry.description).toBe(rawEntry.description);
        }

        expect(entry).toBeInstanceOf(Entry);

        const checkedOperations = new Set(
          rawEntry?.operations.map((op) => op.accountId),
        );

        entry.getOperations().forEach((operation) => {
          const rawOperation = rawEntry?.operations.find((op) => {
            return op.accountId === operation.getAccountId().valueOf();
          });

          if (rawOperation) {
            checkedOperations.delete(rawOperation.accountId);

            expect(operation.getAccountId().valueOf()).toBe(
              rawOperation.accountId,
            );
            expect(operation.amount.valueOf()).toBe(rawOperation.amount);
            expect(operation.description).toBe(rawOperation.description);
          }
        });
        expect(checkedOperations.size).toBe(0);
      });

      expect(checkedEntries.size).toBe(0);

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

  describe('updateEntriesForTransaction', () => {
    it('should update entries for transaction', async () => {
      const entryUpdateData = [
        {
          description: 'New Entry Description',
          operations: [
            {
              accountId: account1.getId(),
              amount: Amount.create('-50'),
              description: 'New Operation From Description',
            },
            {
              accountId: account2.getId(),
              amount: Amount.create('50'),
              description: 'New Operation To Description',
            },
          ],
        },
      ];

      const newEntriesData = entryUpdateData.map((entry) => ({
        description: entry.description,
        operations: entry.operations.map((op) => ({
          accountId: op.accountId.valueOf(),
          amount: op.amount.valueOf(),
          description: op.description,
        })),
      })) as CreateEntryRequestDTO[];

      const operationFrom = Operation.create(
        user,
        account1,
        mockEntry,
        entryUpdateData[0].operations[0].amount,
        entryUpdateData[0].operations[0].description,
      );

      const operationTo = Operation.create(
        user,
        account2,
        mockEntry,
        entryUpdateData[0].operations[1].amount,
        entryUpdateData[0].operations[1].description,
      );

      const mockOperations = [operationFrom, operationTo];

      const entryToDelete = Entry.create(
        user,
        transaction,
        'Entry to be deleted',
      );

      mockEntryRepository.deleteByTransactionId.mockResolvedValue([
        entryToDelete.toPersistence(),
      ]);

      mockAccountRepository.getByIds.mockResolvedValueOnce([
        account1.toPersistence(),
        account2.toPersistence(),
      ]);

      accountFactory.findOrCreateSystemAccount.mockResolvedValue(account3);

      mockCreateOperationFactory.createOperationsForEntry.mockResolvedValue(
        mockOperations,
      );

      mockSaveWithIdRetry.mockResolvedValue(mockEntry);

      const result = await entryFactory.updateEntriesForTransaction({
        newEntriesData,
        transaction,
        user,
      });

      expect(mockOperationRepository.deleteByEntryIds).toHaveBeenCalledWith(
        user.getId().valueOf(),
        [entryToDelete.getId().valueOf()],
      );

      expect(result.description).toBe(transaction.description);

      result.getEntries().forEach((entry) => {
        entry.getOperations().forEach((operation) => {
          expect(operation).toBeInstanceOf(Operation);

          const rawOperation = newEntriesData[0].operations.find((op) => {
            return op.accountId === operation.getAccountId().valueOf();
          });

          expect(rawOperation).toBeDefined();

          expect(rawOperation?.amount).toBe(operation.amount.valueOf());
          expect(rawOperation?.description).toBe(operation.description);
        });
      });
    });
  });
});
