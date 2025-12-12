import { UUID } from '@ledgerly/shared/types';
import {
  CreateEntryRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
import { createTransaction, createUser } from 'src/db/createTestUser';
import { Account, Entry, Operation } from 'src/domain';
import { AccountType } from 'src/domain/';
import { Amount, Currency, Name } from 'src/domain/domain-core';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EntriesContextLoader } from '../entries.context-loader';
import { EntryCreator } from '../entries.creator';
import { EntryUpdater } from '../entries.updater';
import { EntriesService } from '../entry.service';

describe('EntryService', () => {
  let user: Awaited<ReturnType<typeof createUser>>;

  const mockEntriesContextLoader = {
    loadForEntries: vi.fn(),
  };

  const mockEntryCreator = {
    createEntryWithOperations: vi.fn(),
  };

  const mockEntryUpdater = {
    execute: vi.fn(),
  };

  const entryService = new EntriesService(
    mockEntriesContextLoader as unknown as EntriesContextLoader,
    mockEntryCreator as unknown as EntryCreator,
    mockEntryUpdater as unknown as EntryUpdater,
  );

  let account1: Account;
  let account2: Account;
  let account3: Account;

  beforeAll(async () => {
    user = await createUser();

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

  describe('createEntryWithOperations', () => {
    it('should create entries with operations', async () => {
      const transaction = createTransaction(user);

      const mockEntry1 = Entry.create(user, transaction, 'Mock Entry 1');
      const mockEntry2 = Entry.create(user, transaction, 'Mock Entry 2');

      const operationEntry1From = Operation.create(
        user,
        account1,
        mockEntry1,
        Amount.create('-100'),
        'Operation Entry 1 From description',
      );

      const operationEntry2From = Operation.create(
        user,
        account1,
        mockEntry2,
        Amount.create('-100'),
        'Operation Entry 2 From description',
      );

      const operationEntry1To = Operation.create(
        user,
        account2,
        mockEntry1,
        Amount.create('100'),
        'Operation Entry 1 To description',
      );

      const operationEntry2To = Operation.create(
        user,
        account2,
        mockEntry2,
        Amount.create('100'),
        'Operation Entry 2 To description',
      );

      const rawEntries: CreateEntryRequestDTO[] = [
        {
          description: mockEntry1.description,
          operations: [
            {
              accountId: operationEntry1From.getAccountId().valueOf(),
              amount: operationEntry1From.amount.valueOf(),
              description: operationEntry1From.description,
            },
            {
              accountId: operationEntry1To.getAccountId().valueOf(),
              amount: operationEntry1To.amount.valueOf(),
              description: operationEntry1To.description,
            },
          ],
        },
        {
          description: mockEntry2.description,
          operations: [
            {
              accountId: operationEntry2From.getAccountId().valueOf(),
              amount: operationEntry2From.amount.valueOf(),
              description: operationEntry2From.description,
            },
            {
              accountId: operationEntry2To.getAccountId().valueOf(),
              amount: operationEntry2To.amount.valueOf(),
              description: operationEntry2To.description,
            },
          ],
        },
      ];

      const mockAccountsMap = new Map<UUID, Account>([
        [account1.getId().valueOf(), account1],
        [account2.getId().valueOf(), account2],
      ]);

      const mockSystemAccountsMap = new Map<UUID, Account>([
        [account3.getId().valueOf(), account3],
      ]);

      mockEntriesContextLoader.loadForEntries.mockResolvedValue({
        accountsMap: mockAccountsMap,
        systemAccountsMap: mockSystemAccountsMap,
      });

      mockEntryCreator.createEntryWithOperations
        .mockResolvedValueOnce(mockEntry1)
        .mockResolvedValueOnce(mockEntry2);

      const result = await entryService.createEntriesWithOperations(
        user,
        transaction,
        rawEntries,
      );

      expect(result.length).toBe(rawEntries.length);

      expect(mockEntriesContextLoader.loadForEntries).toHaveBeenCalledWith(
        user,
        rawEntries,
      );

      expect(mockEntryCreator.createEntryWithOperations).toHaveBeenCalledTimes(
        rawEntries.length,
      );

      rawEntries.forEach((entryData, index) => {
        expect(
          mockEntryCreator.createEntryWithOperations,
        ).toHaveBeenNthCalledWith(
          index + 1,
          user,
          transaction,
          entryData,
          mockAccountsMap,
          mockSystemAccountsMap,
        );
      });

      result.forEach((entry, index) => {
        const rawEntry = rawEntries[index];

        expect(entry.description).toBe(rawEntry.description);
        expect(entry).toBeInstanceOf(Entry);
      });
    });
  });

  describe('updateEntriesWithOperations', () => {
    it('should update entries with operations', async () => {
      const transaction = createTransaction(user);

      const mockEntry1 = Entry.create(user, transaction, 'Mock Entry 1');
      const mockEntry2 = Entry.create(user, transaction, 'Mock Entry 2');

      const operationEntry1From = Operation.create(
        user,
        account1,
        mockEntry1,
        Amount.create('-100'),
        'Operation Entry 1 From description',
      );

      const operationEntry2From = Operation.create(
        user,
        account1,
        mockEntry2,
        Amount.create('-100'),
        'Operation Entry 2 From description',
      );

      const operationEntry1To = Operation.create(
        user,
        account2,
        mockEntry1,
        Amount.create('100'),
        'Operation Entry 1 To description',
      );

      const operationEntry2To = Operation.create(
        user,
        account2,
        mockEntry2,
        Amount.create('100'),
        'Operation Entry 2 To description',
      );

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [],
        update: [
          {
            description: mockEntry1.description,
            id: mockEntry1.getId().valueOf(),
            operations: [
              {
                accountId: operationEntry1From.getAccountId().valueOf(),
                amount: operationEntry1From.amount.valueOf(),
                description: operationEntry1From.description,
              },
              {
                accountId: operationEntry1To.getAccountId().valueOf(),
                amount: operationEntry1To.amount.valueOf(),
                description: operationEntry1To.description,
              },
            ],
          },
          {
            description: mockEntry2.description,
            id: mockEntry2.getId().valueOf(),
            operations: [
              {
                accountId: operationEntry2From.getAccountId().valueOf(),
                amount: operationEntry2From.amount.valueOf(),
                description: operationEntry2From.description,
              },
              {
                accountId: operationEntry2To.getAccountId().valueOf(),
                amount: operationEntry2To.amount.valueOf(),
                description: operationEntry2To.description,
              },
            ],
          },
        ],
      };

      const mockAccountsMap = new Map<UUID, Account>([
        [account1.getId().valueOf(), account1],
        [account2.getId().valueOf(), account2],
      ]);

      const mockSystemAccountsMap = new Map<UUID, Account>([
        [account3.getId().valueOf(), account3],
      ]);

      mockEntriesContextLoader.loadForEntries.mockResolvedValue({
        accountsMap: mockAccountsMap,
        systemAccountsMap: mockSystemAccountsMap,
      });

      transaction.addEntries([mockEntry1, mockEntry2]);

      mockEntryUpdater.execute.mockResolvedValue(transaction);

      const result = await entryService.updateEntriesWithOperations(
        user,
        transaction,
        newEntriesData,
      );

      expect(mockEntriesContextLoader.loadForEntries).toHaveBeenCalledWith(
        user,
        [...newEntriesData.create, ...newEntriesData.update],
      );

      expect(mockEntryUpdater.execute).toHaveBeenCalledWith({
        entryContext: {
          accountsMap: mockAccountsMap,
          systemAccountsMap: mockSystemAccountsMap,
        },
        newEntriesData,
        transaction,
        user,
      });

      expect(result).toBe(transaction);
    });
  });
});
