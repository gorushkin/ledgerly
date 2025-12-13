import { UUID } from '@ledgerly/shared/types';
import {
  CreateEntryRequestDTO,
  EntryRepositoryInterface,
  OperationRepositoryInterface,
  UpdateEntryRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
import { compareEntry } from 'src/application/comparers';
import { OperationFactory } from 'src/application/services/operation.factory';
import { createUser } from 'src/db/createTestUser';
import { EntryDbRow } from 'src/db/schema';
import { TransactionBuilder } from 'src/db/test-utils';
import { Account, Entry, Operation, Transaction, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core/value-objects/Amount';
import { beforeAll, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

import { EntryCreator, EntryUpdater } from '..';

vi.mock('src/application/comparers', () => ({
  compareEntry: vi.fn(),
}));

describe('EntryUpdater', () => {
  let user: User;

  const mockOperationFactory = {
    createOperationsForEntry: vi.fn(),
  };

  const mockEntryRepository = {
    update: vi.fn(),
    voidByIds: vi.fn(),
  };

  const mockOperationRepository = {
    voidByEntryIds: vi.fn(),
  };

  const mockEntryCreator = {
    createEntryWithOperations: vi.fn(),
  };

  const entriesUpdater = new EntryUpdater(
    mockOperationFactory as unknown as OperationFactory,
    mockEntryRepository as unknown as EntryRepositoryInterface,
    mockOperationRepository as unknown as OperationRepositoryInterface,
    mockEntryCreator as unknown as EntryCreator,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('metadata-only updates', () => {
    it('updates only metadata when compareEntry returns updatedMetadata', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entries, entryContext, transaction } = transactionBuilder
        .withAccounts(['USD', 'EUR'])
        .withSystemAccounts()
        .withEntry('First Entry', [
          {
            accountKey: 'USD',
            amount: Amount.create('10000'),
            description: 'From Operation',
          },
          {
            accountKey: 'EUR',
            amount: Amount.create('-10000'),
            description: 'To Operation',
          },
        ])
        .build();

      const newData = [{ description: 'Updated Entry 1 Description' }];

      const update: UpdateEntryRequestDTO[] = entries.map((entry, index) => {
        return {
          description: newData[index].description,
          id: entry.getId().valueOf(),
        };
      });

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [],
        update,
      };

      const mockEntryDbRow: EntryDbRow = {
        createdAt: entries[0].createdAt,
        description: 'Updated Entry Description',
        id: entries[0].getId().valueOf(),
        isTombstone: entries[0].isDeleted(),
        transactionId: transaction.getId().valueOf(),
        updatedAt: entries[0].updatedAt,
        userId: user.getId().valueOf(),
      };

      mockEntryRepository.update.mockResolvedValue(mockEntryDbRow);

      (compareEntry as Mock).mockReturnValueOnce('updatedMetadata');

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
      });

      expect(compareEntry).toHaveBeenCalledTimes(update.length);

      update.forEach((data, index) => {
        expect(mockEntryRepository.update).toHaveBeenNthCalledWith(
          index + 1,
          user.getId().valueOf(),
          expect.objectContaining({
            description: data.description,
            id: data.id,
          }),
        );
      });

      expect(mockEntryRepository.update).toHaveBeenCalledTimes(update.length);
      expect(mockEntryRepository.voidByIds).not.toHaveBeenCalled();
      expect(mockEntryCreator.createEntryWithOperations).not.toHaveBeenCalled();
      expect(mockOperationRepository.voidByEntryIds).not.toHaveBeenCalled();
      expect(
        mockOperationFactory.createOperationsForEntry,
      ).not.toHaveBeenCalled();

      result.getEntries().forEach((entry, index) => {
        const rawEntry = newEntriesData.update[index];

        expect(entry.description).toBe(rawEntry.description);
        expect(entry).toBeInstanceOf(Entry);
      });
    });
  });

  describe('financial-only updates', () => {
    it('voids previous operations for financial-only update', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entries, entryContext, getAccountByKey, transaction } =
        transactionBuilder
          .withAccounts(['USD', 'EUR', 'RUB'])
          .withSystemAccounts()
          .withEntry('First Entry', [
            {
              accountKey: 'USD',
              amount: Amount.create('10000'),
              description: 'From Operation Old description',
            },
            {
              accountKey: 'EUR',
              amount: Amount.create('-10000'),
              description: 'To Operation Old description',
            },
          ])
          .build();

      const update: UpdateEntryRequestDTO[] = entries.map((entry) => {
        const operationFrom = entry.getOperations()[0];

        return {
          description: entry.description,
          id: entry.getId().valueOf(),
          operations: [
            {
              accountId: operationFrom.getAccountId().valueOf(),
              amount: Amount.create('20000').valueOf(), // changed amount
              description: operationFrom.description,
            },
            {
              accountId: getAccountByKey('RUB')!.getId().valueOf(), // changed account
              amount: Amount.create('-20000').valueOf(), // changed amount
              description: 'New To Operation', // changed description
            },
          ],
        };
      });

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [],
        update,
      };

      (compareEntry as Mock).mockReturnValueOnce('updatedFinancial');

      mockOperationFactory.createOperationsForEntry.mockImplementation(
        (
          user: User,
          existing: Entry,
          incoming: CreateEntryRequestDTO,
          accountsByIdMap: Map<UUID, Account>,
        ) => {
          const operations = incoming.operations.map((opData) => {
            const account = accountsByIdMap.get(opData.accountId)!;

            return Operation.create(
              user,
              account,
              existing,
              Amount.create(opData.amount),
              opData.description,
            );
          });

          return operations;
        },
      );

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
      });

      expect(compareEntry).toHaveBeenCalledTimes(update.length);

      expect(mockEntryRepository.update).not.toHaveBeenCalled();
      expect(mockEntryRepository.voidByIds).not.toHaveBeenCalled();
      expect(mockEntryCreator.createEntryWithOperations).not.toHaveBeenCalled();
      expect(mockOperationRepository.voidByEntryIds).toHaveBeenCalledTimes(
        update.length,
      );

      expect(
        mockOperationFactory.createOperationsForEntry,
      ).toHaveBeenCalledTimes(update.length);

      result.getEntries().forEach((entry, index) => {
        const rawEntry = newEntriesData.update[index];

        expect(entry.description).toBe(rawEntry.description);
        expect(entry).toBeInstanceOf(Entry);

        entry.getOperations().forEach((operation, opIndex) => {
          const rawOperation = rawEntry.operations?.[opIndex];

          if (!rawOperation) {
            throw new Error('rawOperation is undefined');
          }

          expect(operation.description).toBe(rawOperation.description);
          expect(operation.amount.valueOf()).toBe(rawOperation.amount);
          expect(operation.getAccountId().valueOf()).toBe(
            rawOperation.accountId,
          );
        });
      });
    });
  });

  describe('full updates (metadata + financial)', () => {
    it('should void previous operations,  create new ones for full update and update entires', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entries, entryContext, getAccountByKey, transaction } =
        transactionBuilder
          .withAccounts(['USD', 'EUR', 'RUB'])
          .withSystemAccounts()
          .withEntry('First Entry', [
            {
              accountKey: 'USD',
              amount: Amount.create('10000'),
              description: 'From Operation',
            },
            {
              accountKey: 'EUR',
              amount: Amount.create('-10000'),
              description: 'To Operation',
            },
          ])
          .build();

      const update: UpdateEntryRequestDTO[] = entries.map((entry) => {
        const operationFrom = entry.getOperations()[0];

        return {
          description: 'Updated ' + entry.description, // changed description
          id: entry.getId().valueOf(),
          operations: [
            {
              accountId: operationFrom.getAccountId().valueOf(),
              amount: Amount.create('20000').valueOf(), // changed amount
              description: operationFrom.description,
            },
            {
              accountId: getAccountByKey('RUB')!.getId().valueOf(), // changed account
              amount: Amount.create('-20000').valueOf(), // changed amount
              description: 'New To Operation', // changed description
            },
          ],
        };
      });

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [],
        update,
      };

      (compareEntry as Mock).mockReturnValueOnce('updatedBoth');

      const mockEntryDbRow: EntryDbRow = {
        createdAt: entries[0].createdAt,
        description: 'Updated Entry Description',
        id: entries[0].getId().valueOf(),
        isTombstone: entries[0].isDeleted(),
        transactionId: transaction.getId().valueOf(),
        updatedAt: entries[0].updatedAt,
        userId: user.getId().valueOf(),
      };

      mockEntryRepository.update.mockResolvedValue(mockEntryDbRow);

      mockOperationFactory.createOperationsForEntry.mockImplementation(
        (
          user: User,
          existing: Entry,
          incoming: CreateEntryRequestDTO,
          accountsByIdMap: Map<UUID, Account>,
        ) => {
          const operations = incoming.operations.map((opData) => {
            const account = accountsByIdMap.get(opData.accountId)!;

            return Operation.create(
              user,
              account,
              existing,
              Amount.create(opData.amount),
              opData.description,
            );
          });

          return operations;
        },
      );

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
      });

      result.getEntries().forEach((entry, index) => {
        const rawEntry = newEntriesData.update[index];

        expect(entry.description).toBe(rawEntry.description);
        expect(entry).toBeInstanceOf(Entry);

        entry.getOperations().forEach((operation, opIndex) => {
          const rawOperation = rawEntry.operations?.[opIndex];

          if (!rawOperation) {
            throw new Error('rawOperation is undefined');
          }

          expect(operation.description).toBe(rawOperation.description);
          expect(operation.amount.valueOf()).toBe(rawOperation.amount);
          expect(operation.getAccountId().valueOf()).toBe(
            rawOperation.accountId,
          );
        });
      });

      update.forEach((data, index) => {
        expect(mockEntryRepository.update).toHaveBeenNthCalledWith(
          index + 1,
          user.getId().valueOf(),
          expect.objectContaining({
            description: data.description,
            id: data.id,
          }),
        );
      });

      expect(compareEntry).toHaveBeenCalledTimes(update.length);

      expect(mockEntryRepository.update).toHaveBeenCalledTimes(update.length);

      expect(mockEntryRepository.voidByIds).not.toHaveBeenCalled();
      expect(mockEntryCreator.createEntryWithOperations).not.toHaveBeenCalled();

      expect(mockOperationRepository.voidByEntryIds).toHaveBeenCalledTimes(
        update.length,
      );

      expect(
        mockOperationFactory.createOperationsForEntry,
      ).toHaveBeenCalledTimes(update.length);
    });
  });

  describe('unchanged entries', () => {
    it('does nothing when compareEntry returns unchanged', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entries, entryContext, transaction } = transactionBuilder
        .withAccounts(['USD', 'EUR', 'RUB'])
        .withSystemAccounts()
        .withEntry('First Entry', [
          {
            accountKey: 'USD',
            amount: Amount.create('10000'),
            description: 'From Operation',
          },
          {
            accountKey: 'EUR',
            amount: Amount.create('-10000'),
            description: 'To Operation',
          },
        ])
        .build();

      const update: UpdateEntryRequestDTO[] = entries.map((entry) => {
        return {
          description: entry.description,
          id: entry.getId().valueOf(),
        };
      });

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: [],
        update,
      };

      (compareEntry as Mock).mockReturnValueOnce('unchanged');

      // TODO: store json representation of operations before update
      const operationsByEntryIdMap = new Map<UUID, Operation[]>();

      transaction.getEntries().forEach((entry) => {
        operationsByEntryIdMap.set(
          entry.getId().valueOf(),
          entry.getOperations(),
        );
      });

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
      });

      expect(mockEntryRepository.voidByIds).not.toHaveBeenCalled();

      expect(mockEntryCreator.createEntryWithOperations).not.toHaveBeenCalled();

      expect(mockEntryRepository.update).not.toHaveBeenCalled();

      expect(mockOperationRepository.voidByEntryIds).not.toHaveBeenCalled();

      expect(
        mockOperationFactory.createOperationsForEntry,
      ).not.toHaveBeenCalled();

      expect(result).toBe(transaction);

      result.getEntries().forEach((entry, index) => {
        const rawEntry = newEntriesData.update[index];

        expect(entry.description).toBe(rawEntry.description);
        expect(entry).toBeInstanceOf(Entry);

        const originalOperations = operationsByEntryIdMap.get(
          entry.getId().valueOf(),
        );
        expect(originalOperations).toBeDefined();

        entry.getOperations().forEach((operation, opIndex) => {
          const originalOperation = originalOperations![opIndex];

          expect(operation.description).toBe(originalOperation.description);
          expect(operation.amount.valueOf()).toBe(
            originalOperation.amount.valueOf(),
          );
          expect(operation.getAccountId().valueOf()).toBe(
            originalOperation.getAccountId().valueOf(),
          );
        });
      });
    });
  });

  describe('creating new entries', () => {
    it('should create new entries via entryCreator.createEntryWithOperations', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entryContext, transaction } = transactionBuilder
        .withAccounts(['USD', 'EUR', 'RUB'])
        .withSystemAccounts()
        .withEntry('First Entry', [
          {
            accountKey: 'USD',
            amount: Amount.create('10000'),
            description: 'From Operation',
          },
          {
            accountKey: 'EUR',
            amount: Amount.create('-10000'),
            description: 'To Operation',
          },
        ])
        .build();

      const create: CreateEntryRequestDTO[] = [
        {
          description: 'New Entry',
          operations: [
            {
              accountId: transactionBuilder
                .getAccountByKey('RUB')!
                .getId()
                .valueOf(),
              amount: Amount.create('5000').valueOf(),
              description: 'New From Operation',
            },
            {
              accountId: transactionBuilder
                .getAccountByKey('USD')!
                .getId()
                .valueOf(),
              amount: Amount.create('-5000').valueOf(),
              description: 'New To Operation',
            },
          ],
        },
      ];

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create,
        delete: [],
        update: [],
      };

      create.forEach(() => {
        mockEntryCreator.createEntryWithOperations.mockImplementation(
          (
            user: User,
            transaction: Transaction,
            entryData: CreateEntryRequestDTO,
            accountsByIdMap: Map<UUID, Account>,
          ) => {
            const entry = Entry.create(
              user,
              transaction,
              entryData.description,
            );

            const operations = entryData.operations.map((opData) => {
              const account = accountsByIdMap.get(opData.accountId)!;

              return Operation.create(
                user,
                account,
                entry,
                Amount.create(opData.amount),
                opData.description,
              );
            });

            entry.addOperations(operations);

            return entry;
          },
        );
      });

      const previousEntriesCount = transaction.getEntries().length;

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
      });

      expect(result.getEntries().length).toBe(
        previousEntriesCount + create.length,
      );

      const alreadyExistingEntriesMap = transaction
        .getEntries()
        .reduce((acc, entry) => {
          acc.set(entry.getId().valueOf(), entry);
          return acc;
        }, new Map<UUID, Entry>());

      create.forEach((data, index) => {
        expect(
          mockEntryCreator.createEntryWithOperations,
        ).toHaveBeenNthCalledWith(
          index + 1,
          user,
          transaction,
          data,
          entryContext.accountsMap,
          entryContext.systemAccountsMap,
        );
      });

      const compareAlreadyExistingEntry = (
        existedEntry: Entry,
        entry: Entry,
      ) => {
        expect(entry.description).toBe(existedEntry.description);
        expect(entry).toBeInstanceOf(Entry);

        entry.getOperations().forEach((operation, opIndex) => {
          const existedOperation = existedEntry.getOperations()[opIndex];

          expect(operation.description).toBe(existedOperation.description);
          expect(operation.amount.valueOf()).toBe(
            existedOperation.amount.valueOf(),
          );
          expect(operation.getAccountId().valueOf()).toBe(
            existedOperation.getAccountId().valueOf(),
          );
        });
      };

      const compareCreatedEntry = (
        rawEntry: CreateEntryRequestDTO,
        entry: Entry,
      ) => {
        expect(entry.description).toBe(rawEntry.description);
        expect(entry).toBeInstanceOf(Entry);

        entry.getOperations().forEach((operation, opIndex) => {
          const rawOperation = rawEntry.operations?.[opIndex];

          expect(operation.description).toBe(rawOperation.description);
          expect(operation.amount.valueOf()).toBe(rawOperation.amount);
          expect(operation.getAccountId().valueOf()).toBe(
            rawOperation.accountId,
          );
        });
      };

      result.getEntries().forEach((entry, index) => {
        if (alreadyExistingEntriesMap.has(entry.getId().valueOf())) {
          return compareAlreadyExistingEntry(
            alreadyExistingEntriesMap.get(entry.getId().valueOf())!,
            entry,
          );
        }

        const rawEntry =
          newEntriesData.create[index - transaction.getEntries().length];

        compareCreatedEntry(rawEntry, entry);
      });

      expect(mockEntryRepository.voidByIds).not.toHaveBeenCalled();

      expect(mockEntryCreator.createEntryWithOperations).toHaveBeenCalledTimes(
        create.length,
      );

      expect(mockEntryRepository.update).not.toHaveBeenCalled();

      expect(mockOperationRepository.voidByEntryIds).not.toHaveBeenCalled();

      expect(
        mockOperationFactory.createOperationsForEntry,
      ).not.toHaveBeenCalled();
    });
  });

  describe('deleting entries', () => {
    it('should void entries via entryRepository.voidByIds', async () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const { entries, entryContext, transaction } = transactionBuilder
        .withAccounts(['USD', 'EUR'])
        .withSystemAccounts()
        .withEntry('First Entry', [
          {
            accountKey: 'USD',
            amount: Amount.create('10000'),
            description: 'From Operation',
          },
          {
            accountKey: 'EUR',
            amount: Amount.create('-10000'),
            description: 'To Operation',
          },
        ])
        .build();

      const idsToDelete = entries.map((entry) => entry.getId().valueOf());

      const newEntriesData: UpdateTransactionRequestDTO['entries'] = {
        create: [],
        delete: idsToDelete,
        update: [],
      };

      const previousEntriesCount = transaction.getEntries().length;

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
      });

      expect(mockEntryRepository.voidByIds).toHaveBeenCalledWith(
        user.getId().valueOf(),
        idsToDelete,
      );

      expect(mockEntryRepository.voidByIds).toHaveBeenCalledTimes(1);

      expect(mockEntryCreator.createEntryWithOperations).not.toHaveBeenCalled();

      expect(mockEntryRepository.update).not.toHaveBeenCalled();

      expect(mockOperationRepository.voidByEntryIds).not.toHaveBeenCalled();

      expect(
        mockOperationFactory.createOperationsForEntry,
      ).not.toHaveBeenCalled();

      expect(result.getEntries().length).toBe(
        previousEntriesCount - idsToDelete.length,
      );
    });
  });
});
