import {
  CreateEntryRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
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

import {
  EntriesContextLoader,
  EntryCreator,
  EntryUpdater,
} from '../EntriesService';
import { EntriesService } from '../EntriesService/entry.service';

describe.skip('EntryService', () => {
  let user: Awaited<ReturnType<typeof createUser>>;
  let transaction: ReturnType<typeof createTransaction>;

  const accountFactory = {
    findOrCreateSystemAccount: vi.fn(),
  };

  const mockEntryRepository = {
    create: vi.fn(),
    deleteByTransactionId: vi.fn(),
    voidByIds: vi.fn(),
  };

  const mockAccountRepository = {
    getByIds: vi.fn(),
  };

  const mockSaveWithIdRetry = vi.fn();

  const mockCreateOperationFactory = {
    createOperationsForEntry: vi.fn(),
    preloadAccounts: vi.fn(),
  };

  const entriesContextLoader = {
    loadForEntries: vi.fn(),
  };

  const entryCreator = {
    createEntryWithOperations: vi.fn(),
  };

  const entryUpdater = {
    execute: vi.fn(),
  };

  const entryService = new EntriesService(
    entriesContextLoader as unknown as EntriesContextLoader,
    entryCreator as unknown as EntryCreator,
    entryUpdater as unknown as EntryUpdater,
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

  describe.skip('createEntryWithOperations', () => {
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

      const result = await entryService.createEntriesWithOperations(
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

  describe.skip('updateEntriesForTransaction', () => {
    // it('should update entries for transaction', async () => {
    //   const entryUpdateData = [
    //     {
    //       description: 'New Entry Description',
    //       operations: [
    //         {
    //           accountId: account1.getId(),
    //           amount: Amount.create('-50'),
    //           description: 'New Operation From Description',
    //         },
    //         {
    //           accountId: account2.getId(),
    //           amount: Amount.create('50'),
    //           description: 'New Operation To Description',
    //         },
    //       ],
    //     },
    //   ];
    //   const newEntriesData = entryUpdateData.map((entry) => ({
    //     description: entry.description,
    //     operations: entry.operations.map((op) => ({
    //       accountId: op.accountId.valueOf(),
    //       amount: op.amount.valueOf(),
    //       description: op.description,
    //     })),
    //   })) as CreateEntryRequestDTO[];
    //   const operationFrom = Operation.create(
    //     user,
    //     account1,
    //     mockEntry,
    //     entryUpdateData[0].operations[0].amount,
    //     entryUpdateData[0].operations[0].description,
    //   );
    //   const operationTo = Operation.create(
    //     user,
    //     account2,
    //     mockEntry,
    //     entryUpdateData[0].operations[1].amount,
    //     entryUpdateData[0].operations[1].description,
    //   );
    //   const mockOperations = [operationFrom, operationTo];
    //   const entryToDelete = Entry.create(
    //     user,
    //     transaction,
    //     'Entry to be deleted',
    //   );
    //   mockEntryRepository.deleteByTransactionId.mockResolvedValue([
    //     entryToDelete.toPersistence(),
    //   ]);
    //   mockAccountRepository.getByIds.mockResolvedValueOnce([
    //     account1.toPersistence(),
    //     account2.toPersistence(),
    //   ]);
    //   accountFactory.findOrCreateSystemAccount.mockResolvedValue(account3);
    //   mockCreateOperationFactory.createOperationsForEntry.mockResolvedValue(
    //     mockOperations,
    //   );
    //   mockSaveWithIdRetry.mockResolvedValue(mockEntry);
    //   const result = await entryService.updateEntriesForTransaction({
    //     newEntriesData,
    //     transaction,
    //     user,
    //   });
    //   expect(mockOperationRepository.deleteByEntryIds).toHaveBeenCalledWith(
    //     user.getId().valueOf(),
    //     [entryToDelete.getId().valueOf()],
    //   );
    //   expect(result.description).toBe(transaction.description);
    //   result.getEntries().forEach((entry) => {
    //     entry.getOperations().forEach((operation) => {
    //       expect(operation).toBeInstanceOf(Operation);
    //       const rawOperation = newEntriesData[0].operations.find((op) => {
    //         return op.accountId === operation.getAccountId().valueOf();
    //       });
    //       expect(rawOperation).toBeDefined();
    //       expect(rawOperation?.amount).toBe(operation.amount.valueOf());
    //       expect(rawOperation?.description).toBe(operation.description);
    //     });
    //   });
    // });
  });

  describe('updateEntriesForTransaction', () => {
    it('should do nothing if there are no entries data', async () => {
      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [],
        update: [],
      };

      const updatedTransaction = await entryService.updateEntriesWithOperations(
        {
          newEntriesData,
          transaction,
          user,
        },
      );

      expect(updatedTransaction).toBe(transaction);
    });

    it('should delete entries with operations if delete is not empty', async () => {
      const entry1 = Entry.create(user, transaction, 'Entry 1 to be deleted');
      const entry2 = Entry.create(user, transaction, 'Entry 2 to be deleted');
      const entry3 = Entry.create(user, transaction, 'Entry 3 to be deleted');

      transaction.addEntry(entry1);
      transaction.addEntry(entry2);

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [
          entry1.getId().valueOf(),
          entry2.getId().valueOf(),
          entry3.getId().valueOf(),
        ],
        update: [],
      };

      const updatedTransaction = await entryService.updateEntriesWithOperations(
        {
          newEntriesData,
          transaction,
          user,
        },
      );

      expect(mockEntryRepository.voidByIds).toHaveBeenCalledWith(
        user.getId().valueOf(),
        [entry1.getId().valueOf(), entry2.getId().valueOf()],
      );

      expect(mockEntryRepository.voidByIds).not.toHaveBeenCalledWith(
        user.getId().valueOf(),
        [entry3.getId().valueOf()],
      );

      expect(updatedTransaction).toBe(transaction);
    });
  });
});
