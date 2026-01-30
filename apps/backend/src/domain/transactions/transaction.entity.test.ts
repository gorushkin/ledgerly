import { IsoDateString, MoneyString, UUID } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application';
import { CreateTransactionRequestDTO } from 'src/application/dto/transaction.dto';
import { createUser } from 'src/db/createTestUser';
import {
  TransactionBuilder,
  TransactionBuilderResult,
} from 'src/db/test-utils';
import {
  ConflictingEntryIdsError,
  EntryNotFoundInTransactionError,
  MissingTransactionContextError,
} from 'src/domain/domain.errors';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Amount } from '../domain-core';
import { Entry } from '../entries';
import { EntryDraft, EntryUpdate } from '../entries/types';
import { User } from '../users/user.entity';

import { Transaction } from './transaction.entity';
import { TransactionBuildContext } from './types';

describe('Transaction Domain Entity', () => {
  let user: User;
  let entryContext: TransactionBuildContext;
  let entries: CreateEntryRequestDTO[];
  let transactionDTO: CreateTransactionRequestDTO;
  let data: TransactionBuilderResult;

  const transactionData = {
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
  };

  const entriesData = [
    {
      description: 'First Entry',
      operations: [
        { accountKey: 'USD', amount: '10000', description: '1' },
        { accountKey: 'USD', amount: '-10000', description: '2' },
      ],
    },
  ];

  beforeAll(async () => {
    user = await createUser();

    const transactionBuilder = TransactionBuilder.create(user);

    data = transactionBuilder
      .withSettings(transactionData)
      .withAccounts(['USD', 'EUR', 'RUB', 'TRY'])
      .withSystemAccounts()
      .withEntries(entriesData)
      .build();

    entries = data.transactionDTO.entries;
    entryContext = data.entryContext;
    transactionDTO = data.transactionDTO;
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Creation and Restoration', () => {
    it('should create a valid transaction with entries', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.description).toBe(transactionData.description);
      expect(transaction.getPostingDate().valueOf()).toEqual(
        transactionData.postingDate,
      );
      expect(transaction.getTransactionDate().valueOf()).toEqual(
        transactionData.transactionDate,
      );
      expect(transaction.getId()).toBeDefined();
      expect(transaction.getCreatedAt()).toBeDefined();
      expect(transaction.getUpdatedAt()).toBeDefined();
      expect(transaction.isDeleted()).toBe(false);

      const transactionEntries = transaction.getEntries();

      expect(transactionEntries).toHaveLength(entries.length);

      transactionEntries.forEach((entry, index) => {
        const matchedEntryData = entriesData[index];

        expect(entry).toBeInstanceOf(Entry);
        expect(entry.description).toBe(matchedEntryData.description);

        const entryOperations = entry.getOperations();

        entryOperations.forEach((op, opIndex) => {
          const matchedOp = matchedEntryData.operations[opIndex];

          expect(op.amount.valueOf()).toBe(matchedOp.amount);
          expect(op.description).toBe(matchedOp.description);
        });
      });
    });

    it('should serialize and deserialize correctly', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const transactionSnapshot = transaction.toSnapshot();

      expect(transactionSnapshot).toMatchObject({
        description: transactionData.description,
        postingDate: transactionData.postingDate,
        transactionDate: transactionData.transactionDate,
        userId: user.getId().valueOf(),
      });

      const restoredTransaction = Transaction.restore(transactionSnapshot);
      expect(restoredTransaction.toSnapshot()).toEqual(transactionSnapshot);
    });
  });

  describe('Updating Transaction data', () => {
    it('Should update only description', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const description = 'Updated transaction description';

      const originalSnapshot = transaction.toSnapshot();

      transaction.applyUpdate(
        { entries: null, metadata: { description } },
        entryContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(updatedSnapshot.description).toBe(description);

      expect(originalSnapshot.entries).toEqual(updatedSnapshot.entries);
      expect(originalSnapshot.postingDate).toBe(updatedSnapshot.postingDate);
      expect(originalSnapshot.transactionDate).toBe(
        updatedSnapshot.transactionDate,
      );
    });

    it('Should update only postingDate', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const postingDate = '2024-02-15' as IsoDateString;

      const originalSnapshot = transaction.toSnapshot();

      transaction.applyUpdate(
        { entries: null, metadata: { postingDate } },
        entryContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(updatedSnapshot.postingDate).toBe(postingDate);

      expect(originalSnapshot.entries).toEqual(updatedSnapshot.entries);
      expect(originalSnapshot.description).toBe(updatedSnapshot.description);
      expect(originalSnapshot.transactionDate).toBe(
        updatedSnapshot.transactionDate,
      );
    });

    it('Should update only transactionDate', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const transactionDate = '2024-03-10' as IsoDateString;

      const originalSnapshot = transaction.toSnapshot();

      transaction.applyUpdate(
        { entries: null, metadata: { transactionDate } },
        entryContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(updatedSnapshot.transactionDate).toBe(transactionDate);

      expect(originalSnapshot.entries).toEqual(updatedSnapshot.entries);
      expect(originalSnapshot.description).toBe(updatedSnapshot.description);
      expect(originalSnapshot.postingDate).toBe(updatedSnapshot.postingDate);
    });

    it('Should update all fields at once and increase version', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const originalSnapshot = transaction.toSnapshot();

      const description = 'Fully updated transaction';
      const postingDate = '2024-04-01' as IsoDateString;
      const transactionDate = '2024-04-05' as IsoDateString;

      transaction.applyUpdate(
        {
          entries: null,
          metadata: { description, postingDate, transactionDate },
        },
        entryContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(updatedSnapshot.description).toBe(description);
      expect(updatedSnapshot.postingDate).toBe(postingDate);
      expect(updatedSnapshot.transactionDate).toBe(transactionDate);
      expect(originalSnapshot.entries).toEqual(updatedSnapshot.entries);
      expect(originalSnapshot.version + 1).toBe(updatedSnapshot.version);
    });
  });

  describe('Manage Entries', () => {
    it('Should add a new entry', () => {
      const usdAccount = data.getAccountByKey('USD');
      const tryAccount = data.getAccountByKey('TRY');
      const eurAccount = data.getAccountByKey('EUR');

      const entryDataInitial: EntryDraft = {
        description: 'Entry initial',
        operations: [
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('5000').toPersistence(),
            description: 'Entry initial Op 1',
          },
          {
            accountId: tryAccount.getId().valueOf(),
            amount: Amount.create('-5000').toPersistence(),
            description: 'Entry initial Op 2',
          },
        ],
      };

      const transaction = Transaction.create(
        user.getId(),
        { ...transactionDTO, entries: [entryDataInitial] },
        entryContext,
      );

      const newEntryData: EntryDraft = {
        description: 'New Entry',
        operations: [
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('5000').toPersistence(),
            description: 'New Entry Op 1',
          },
          {
            accountId: tryAccount.getId().valueOf(),
            amount: Amount.create('-5000').toPersistence(),
            description: 'New Entry Op 2',
          },
        ],
      };

      const transactionEntriesData = [entryDataInitial, newEntryData];

      transaction.applyUpdate(
        {
          entries: {
            create: [newEntryData],
            delete: [],
            update: [],
          },
        },
        entryContext,
      );

      const snapshot = transaction.toSnapshot();

      transactionEntriesData.forEach((entryData, index) => {
        const matchedEntry = snapshot.entries[index];

        expect(matchedEntry).toBeDefined();

        entryData.operations.forEach((op, opIndex) => {
          expect(matchedEntry.operations[opIndex]).toBeDefined();

          const matchedOp = matchedEntry.operations[opIndex];

          expect(matchedOp.accountId).toBe(op.accountId);
          expect(matchedOp.amount).toBe(op.amount);
          expect(matchedOp.description).toBe(op.description);
        });
      });
    });

    it('Should update an entry description only and increment version', () => {
      const tryAccount = data.getAccountByKey('TRY');
      const eurAccount = data.getAccountByKey('EUR');

      const entryDataInitial: EntryDraft = {
        description: 'Entry initial',
        operations: [
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('5000').toPersistence(),
            description: 'Entry initial Op 1',
          },
          {
            accountId: tryAccount.getId().valueOf(),
            amount: Amount.create('-5000').toPersistence(),
            description: 'Entry initial Op 2',
          },
        ],
      };

      const transaction = Transaction.create(
        user.getId(),
        { ...transactionDTO, entries: [entryDataInitial] },
        entryContext,
      );

      const entryToUpdate = transaction.toSnapshot().entries[0];

      const newEntryData: EntryUpdate = {
        description: 'New Entry description',
        id: entryToUpdate.id,
      };

      transaction.applyUpdate(
        {
          entries: {
            create: [],
            delete: [],
            update: [newEntryData],
          },
        },
        entryContext,
      );

      const snapshot = transaction.toSnapshot();

      snapshot.entries.forEach((entry) => {
        expect(entry.id).toBe(entryToUpdate.id);
        expect(entry.description).toBe(newEntryData.description);
        expect(entry.version).toBe(entryToUpdate.version + 1);

        entry.operations.forEach((op, opIndex) => {
          const originalOp = entryToUpdate.operations[opIndex];

          expect(op.accountId).toBe(originalOp.accountId);
          expect(op.amount).toBe(originalOp.amount);
          expect(op.description).toBe(originalOp.description);
        });
      });
    });

    it('Should update entry operations and increment version', () => {
      const tryAccount = data.getAccountByKey('TRY');
      const eurAccount = data.getAccountByKey('EUR');

      const entryDataInitial: EntryDraft = {
        description: 'Entry initial',
        operations: [
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('5000').toPersistence(),
            description: 'Entry initial Op 1',
          },
          {
            accountId: tryAccount.getId().valueOf(),
            amount: Amount.create('-5000').toPersistence(),
            description: 'Entry initial Op 2',
          },
        ],
      };

      const transaction = Transaction.create(
        user.getId(),
        { ...transactionDTO, entries: [entryDataInitial] },
        entryContext,
      );

      const entryToUpdate = transaction.toSnapshot().entries[0];

      const newEntryData: EntryUpdate = {
        description: 'New Entry description',
        id: entryToUpdate.id,
        operations: [
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('5000').toPersistence(),
            description: 'Updated Op 1',
          },
          {
            accountId: tryAccount.getId().valueOf(),
            amount: Amount.create('-7000').toPersistence(),
            description: 'Updated Op 2',
          },
        ],
      };

      transaction.applyUpdate(
        {
          entries: {
            create: [],
            delete: [],
            update: [newEntryData],
          },
        },
        entryContext,
      );

      const snapshot = transaction.toSnapshot();

      snapshot.entries.forEach((entry) => {
        expect(entry.id).toBe(entryToUpdate.id);
        expect(entry.description).toBe(newEntryData.description);
        expect(entry.version).toBe(entryToUpdate.version + 1);
        entry.operations.forEach((op, opIndex) => {
          if (op.isSystem) {
            return;
          }

          const matchedOp = newEntryData.operations?.[opIndex];

          expect(matchedOp).toBeDefined();

          expect(op.accountId).toBe(matchedOp?.accountId);
          expect(op.amount).toBe(matchedOp?.amount);
          expect(op.description).toBe(matchedOp?.description);
        });
      });
    });
  });

  describe('Deletion', () => {
    it('should mark transaction as deleted and all related entries and operations', () => {
      const tryAccount = data.getAccountByKey('TRY');
      const eurAccount = data.getAccountByKey('EUR');

      const entryDataInitial: EntryDraft = {
        description: 'Entry initial',
        operations: [
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('5000').toPersistence(),
            description: 'Entry initial Op 1',
          },
          {
            accountId: tryAccount.getId().valueOf(),
            amount: Amount.create('-5000').toPersistence(),
            description: 'Entry initial Op 2',
          },
        ],
      };

      const transaction = Transaction.create(
        user.getId(),
        { ...transactionDTO, entries: [entryDataInitial] },
        entryContext,
      );

      const versionBeforeDelete = transaction.toSnapshot().version;

      transaction.markAsDeleted();

      expect(transaction.isDeleted()).toBe(true);

      const entries = transaction.getEntries();

      entries.forEach((entry) => {
        expect(entry.isDeleted()).toBe(true);

        entry.getOperations().forEach((op) => {
          expect(op.isDeleted()).toBe(true);
        });
      });

      expect(transaction.toSnapshot().version).toBe(versionBeforeDelete + 1);
    });

    it('Should delete an entry from transaction', () => {
      const tryAccount = data.getAccountByKey('TRY');
      const eurAccount = data.getAccountByKey('EUR');

      const entryData: EntryDraft[] = [
        {
          description: 'Entry One',
          operations: [
            {
              accountId: eurAccount.getId().valueOf(),
              amount: Amount.create('5000').toPersistence(),
              description: 'Entry initial Op 1',
            },
            {
              accountId: tryAccount.getId().valueOf(),
              amount: Amount.create('-5000').toPersistence(),
              description: 'Entry initial Op 2',
            },
          ],
        },
        {
          description: 'Entry Two',
          operations: [
            {
              accountId: eurAccount.getId().valueOf(),
              amount: Amount.create('8000').toPersistence(),
              description: 'Entry initial Op 1',
            },
            {
              accountId: tryAccount.getId().valueOf(),
              amount: Amount.create('-8000').toPersistence(),
              description: 'Entry initial Op 2',
            },
          ],
        },
      ];

      const transaction = Transaction.create(
        user.getId(),
        { ...transactionDTO, entries: entryData },
        entryContext,
      );

      transaction.getEntries().forEach((entry, index) => {
        const matchedEntryData = entryData[index];

        expect(entry).toBeDefined();
        expect(entry.description).toBe(matchedEntryData.description);
      });

      const entryToDelete = transaction.toSnapshot().entries[0];
      const entryVersionBeforeDelete = entryToDelete.version;

      const transactionVersionBeforeEdit = transaction.toSnapshot().version;

      transaction.applyUpdate(
        {
          entries: {
            create: [],
            delete: [entryToDelete.id],
            update: [],
          },
        },
        entryContext,
      );

      transaction.getEntries().forEach((entry) => {
        if (entry.getId().valueOf() === entryToDelete.id) {
          expect(entry.isDeleted()).toBe(true);
          expect(entry.toSnapshot().version).toBe(entryVersionBeforeDelete + 1);
          const operations = entry.getOperations();

          operations.forEach((op) => {
            expect(op.isDeleted()).toBe(true);
          });

          return;
        }

        expect(entry.isDeleted()).toBe(false);
        expect(entry.toSnapshot().version).toBe(0);

        const operations = entry.getOperations();
        operations.forEach((op) => {
          expect(op.isDeleted()).toBe(false);
        });
      });

      expect(transaction.isDeleted()).toBe(false);
      expect(transaction.toSnapshot().version).toBe(
        transactionVersionBeforeEdit + 1,
      );
    });
  });

  // it.skip('should update description via update method and touch updatedAt', () => {
  //   const transaction = Transaction.create(user, transactionDTO, entryContext);

  //   const originalUpdatedAt = transaction.getUpdatedAt();

  //   vi.advanceTimersByTime(5);

  //   transaction.update({ description: 'Updated description' });

  //   expect(transaction.description).toBe('Updated description');

  //   expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
  //     originalUpdatedAt.toDate().getTime(),
  //   );

  //   expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
  // });

  // it.skip('should update postingDate via update method and touch updatedAt', () => {
  //   const transaction = Transaction.create(user, transactionDTO, entryContext);

  //   const originalUpdatedAt = transaction.getUpdatedAt();
  //   const newPostingDate = '2024-01-15' as IsoDateString;

  //   vi.advanceTimersByTime(5);

  //   transaction.update({ postingDate: newPostingDate });

  //   expect(transaction.getPostingDate().valueOf()).toBe(newPostingDate);
  //   expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
  //   expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
  //     originalUpdatedAt.toDate().getTime(),
  //   );
  // });

  // it.skip('should update transactionDate via update method and touch updatedAt', () => {
  //   const transaction = Transaction.create(user, transactionDTO, entryContext);

  //   const originalUpdatedAt = transaction.getUpdatedAt();
  //   const newTransactionDate = '2024-01-20' as IsoDateString;

  //   vi.advanceTimersByTime(5);

  //   transaction.update({ transactionDate: newTransactionDate });

  //   expect(transaction.getTransactionDate().valueOf()).toBe(newTransactionDate);
  //   expect(originalUpdatedAt).not.toEqual(transaction.getUpdatedAt());
  //   expect(transaction.getUpdatedAt().toDate().getTime()).toBeGreaterThan(
  //     originalUpdatedAt.toDate().getTime(),
  //   );
  // });

  // it.skip('should update multiple fields at once via update method', () => {
  //   const transaction = Transaction.create(user, transactionDTO, entryContext);
  //   const newDescription = 'New description';
  //   const newPostingDate = '2024-02-01' as IsoDateString;
  //   const newTransactionDate = '2024-02-05' as IsoDateString;

  //   transaction.update({
  //     description: newDescription,
  //     postingDate: newPostingDate,
  //     transactionDate: newTransactionDate,
  //   });

  //   expect(transaction.description).toBe(newDescription);
  //   expect(transaction.getPostingDate().valueOf()).toBe(newPostingDate);
  //   expect(transaction.getTransactionDate().valueOf()).toBe(newTransactionDate);
  // });

  // TODO: fix and enable these tests
  // describe('Entry Management', () => {
  //   let transaction: Transaction;

  //   beforeEach(() => {
  //     transaction = Transaction.create(userId, transactionDTO);
  //   });

  //   it.skip('should start with empty entries array', () => {
  //     expect(transaction.getEntries()).toEqual([]);
  //   });

  //   it.skip('should add entry successfully', () => {
  //     const transaction = Transaction.create(userId, transactionDTO);

  //     const mockEntry1 = {
  //       belongsToTransaction: () => true,
  //       data: 'mock entry data1',
  //     } as unknown as Entry;

  //     const mockEntry2 = {
  //       belongsToTransaction: () => true,
  //       data: 'mock entry data2',
  //     } as unknown as Entry;

  //     vi.spyOn(Entry, 'create').mockReturnValue(mockEntry1);

  //     transaction.addEntry(mockEntry1);
  //     transaction.addEntry(mockEntry2);

  //     const entries = transaction.getEntries();
  //     expect(entries).toHaveLength(2);
  //     expect(entries[0]).toBe(mockEntry1);
  //     expect(entries[1]).toBe(mockEntry2);
  //   });

  //   it.todo('should remove entry successfully', () => {
  //     // TODO: Implement when Entry.create is available
  //     // const entry = Entry.create(/* appropriate parameters */);
  //     // transaction.addEntry(entry);
  //     // transaction.removeEntry(entry.getId());
  //     // expect(transaction.getEntries()).toHaveLength(0);
  //   });

  //   it.todo('should throw error when removing non-existent entry', () => {
  //     // const nonExistentId = Id.create();
  //     // expect(() => transaction.removeEntry(nonExistentId)).toThrow('Entry not found in transaction');
  //   });

  //   it.todo('should validate entry belongs to transaction when adding', () => {
  //     // TODO: Test that entry validation works correctly
  //   });

  //   it.skip('should provide read-only access to entries', () => {
  //     const entries = transaction.getEntries();
  //     expect(entries).toBeInstanceOf(Array);

  //     // Should return a readonly array
  //     expect(transaction.getEntries()).toHaveLength(0);
  //   });

  //   it.todo('should implement balance validation', () => {
  //     // TODO: Implement isBalanced and validateBalance tests
  //   });
  // });

  describe('EntriesPatch Validation', () => {
    it('should throw error when same ID appears in update and delete arrays', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const entry = transaction.getEntries()[0];
      const entryId = entry.getId().valueOf();

      expect(() => {
        transaction.applyUpdate(
          {
            entries: {
              create: [],
              delete: [entryId],
              update: [{ description: 'Updated', id: entryId }],
            },
          },
          entryContext,
        );
      }).toThrow(ConflictingEntryIdsError);
    });

    it('should throw error when duplicate IDs exist in update array', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const entry = transaction.getEntries()[0];
      const entryId = entry.getId().valueOf();

      expect(() => {
        transaction.applyUpdate(
          {
            entries: {
              create: [],
              delete: [],
              update: [
                { description: 'Update 1', id: entryId },
                { description: 'Update 2', id: entryId },
              ],
            },
          },
          entryContext,
        );
      }).toThrow(ConflictingEntryIdsError);
    });

    it('should throw error when duplicate IDs exist in delete array', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const entry = transaction.getEntries()[0];
      const entryId = entry.getId().valueOf();

      expect(() => {
        transaction.applyUpdate(
          {
            entries: {
              create: [],
              delete: [entryId, entryId],
              update: [],
            },
          },
          entryContext,
        );
      }).toThrow(ConflictingEntryIdsError);
    });

    it('should successfully apply patch when no conflicts exist', () => {
      const transactionBuilder = TransactionBuilder.create(user);

      const multiEntryData = transactionBuilder
        .withSettings(transactionData)
        .withAccounts(['USD'])
        .withSystemAccounts()
        .withEntries([
          {
            description: 'Entry 1',
            operations: [
              { accountKey: 'USD', amount: '10000', description: '1' },
              { accountKey: 'USD', amount: '-10000', description: '2' },
            ],
          },
          {
            description: 'Entry 2',
            operations: [
              { accountKey: 'USD', amount: '20000', description: '3' },
              { accountKey: 'USD', amount: '-20000', description: '4' },
            ],
          },
        ])
        .build();

      const transaction = Transaction.create(
        user.getId(),
        multiEntryData.transactionDTO,
        multiEntryData.entryContext,
      );

      const entries = transaction.getEntries();
      const entryToUpdate = entries[0].getId().valueOf();
      const entryToDelete = entries[1].getId().valueOf();

      expect(() => {
        transaction.applyUpdate(
          {
            entries: {
              create: [],
              delete: [entryToDelete],
              update: [{ description: 'Updated Entry', id: entryToUpdate }],
            },
          },
          multiEntryData.entryContext,
        );
      }).not.toThrow();

      expect(transaction.getEntryById(entryToDelete)?.isDeleted()).toBe(true);
    });

    it('should throw error when trying to update non-existent entry', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const nonExistentId = '00000000-0000-0000-0000-000000000000' as UUID;

      expect(() => {
        transaction.applyUpdate(
          {
            entries: {
              create: [],
              delete: [],
              update: [{ description: 'Update', id: nonExistentId }],
            },
          },
          entryContext,
        );
      }).toThrow(EntryNotFoundInTransactionError);
    });

    it('should throw error when TransactionBuildContext is missing for create', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const account = data.entryContext.accountsMap.values().next().value;

      if (!account) {
        throw new Error('Account not found');
      }

      expect(() => {
        transaction.applyUpdate({
          entries: {
            create: [
              {
                description: 'New Entry',
                operations: [
                  {
                    accountId: account.getId().valueOf(),
                    amount: '100.00' as MoneyString,
                    description: 'op1',
                  },
                  {
                    accountId: account.getId().valueOf(),
                    amount: '-100.00' as MoneyString,
                    description: 'op2',
                  },
                ],
              },
            ],
            delete: [],
            update: [],
          },
        });
      }).toThrow(MissingTransactionContextError);
    });

    it('should throw error when TransactionBuildContext is missing for update', () => {
      const transaction = Transaction.create(
        user.getId(),
        transactionDTO,
        entryContext,
      );

      const entry = transaction.getEntries()[0];
      const entryId = entry.getId().valueOf();

      expect(() => {
        transaction.applyUpdate({
          entries: {
            create: [],
            delete: [],
            update: [{ description: 'Updated', id: entryId }],
          },
        });
      }).toThrow(MissingTransactionContextError);
    });
  });
});
