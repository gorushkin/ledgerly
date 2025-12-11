import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
  UpdateEntryRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
import { OperationFactory } from 'src/application/services/operation.factory';
import { createUser } from 'src/db/createTestUser';
import { EntryDbRow } from 'src/db/schema';
import { TransactionBuilder } from 'src/db/test-utils';
import { Entry, User } from 'src/domain';
import { Amount } from 'src/domain/domain-core/value-objects/Amount';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { EntryCreator, EntryUpdater } from '..';

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

  describe('metadata-only updates', () => {
    it('updates only metadata when compareEntry returns updatedMetadata', async () => {
      const transactionBuilder = TransactionBuilder.create();
      const { entries, entryContext, transaction } = transactionBuilder
        .withUser(user)
        .withAccounts(['USD', 'EUR'])
        .withSystemAccounts()
        .withEntry('First Entry', [
          {
            accountKey: 'USD',
            amount: Amount.create('0'),
            description: 'From Operation',
          },
          {
            accountKey: 'EUR',
            amount: Amount.create('0'),
            description: 'To Operation',
          },
        ])
        .build();

      const newData = [{ description: 'Updated Entry 1 Description' }];

      const update: UpdateEntryRequestDTO[] = entries.map((entry, index) => {
        const operationFrom = entry.getOperations()[0];
        const operationTo = entry.getOperations()[1];

        return {
          description: newData[index].description,
          id: entry.getId().valueOf(),
          operations: [
            {
              accountId: operationFrom.getAccountId().valueOf(),
              amount: operationFrom.amount.valueOf(),
              description: operationFrom.description,
              entryId: entry.getId().valueOf(),
              id: operationFrom.getId().valueOf(),
            },
            {
              accountId: operationTo.getAccountId().valueOf(),
              amount: operationTo.amount.valueOf(),
              description: operationTo.description,
              entryId: entry.getId().valueOf(),
              id: operationTo.getId().valueOf(),
            },
          ],
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

      const result = await entriesUpdater.execute({
        entryContext,
        newEntriesData,
        transaction,
        user,
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

        entry.getOperations().forEach((operation, opIndex) => {
          const rawOperation = rawEntry.operations[opIndex];

          expect(operation.description).toBe(rawOperation.description);
          expect(operation.amount.valueOf()).toBe(rawOperation.amount);
          expect(operation.getAccountId().valueOf()).toBe(
            rawOperation.accountId,
          );
        });
      });
    });
  });

  // describe('financial-only updates', () => {
  //   it.todo('voids previous operations for financial-only update');
  //   it.todo(
  //     'creates new operations via operationFactory.createOperationsForEntry',
  //   );
  //   it.todo('does not call entryRepository.update');
  //   it.todo('updates existing entry operations via updateOperations');
  // });

  // describe('full updates (metadata + financial)', () => {
  //   it.todo('updates metadata before financial changes');
  //   it.todo('voids operations and recreates new ones');
  //   it.todo('returns updated entry with both metadata and operations changed');
  // });

  // describe('unchanged entries', () => {
  //   it.todo('does nothing when compareEntry returns unchanged');
  //   it.todo(
  //     'does not call entryRepository.update or operationRepository.voidByEntryIds',
  //   );
  // });

  // describe('creating new entries', () => {
  //   it.todo(
  //     'calls entryCreator.createEntryWithOperations for each created entry',
  //   );
  //   it.todo('adds newly created entries to transaction');
  // });

  // describe('deleting entries', () => {
  //   it.todo('voids deleted entries via entryRepository.voidByIds');
  //   it.todo('removes deleted entries from transaction');
  //   it.todo('does not process deleted entries in update logic');
  // });

  // describe('combined operations (create + update + delete)', () => {
  //   it.todo('executes deletion before creation and updates');
  //   it.todo('final transaction contains updated + created entries only');
  // });

  // describe('balance validation', () => {
  //   it.todo('calls transaction.validateEntriesBalance after all operations');
  //   it.todo('throws if validateEntriesBalance fails');
  // });

  // describe('voiding operations', () => {
  //   it.todo('voids operations only for entries with financial or full updates');
  //   it.todo('does not void operations for metadata-only or unchanged entries');
  // });

  // describe('compareEntry routing', () => {
  //   it.todo('routes updatedMetadata to metadata update handler');
  //   it.todo('routes updatedFinancial to financial update handler');
  //   it.todo('routes updatedBoth to full update handler');
  //   it.todo('routes unchanged to no-op');
  // });

  // describe('operationFactory integration', () => {
  //   it.todo(
  //     'passes correct accountsMap and systemAccountsMap to operationFactory',
  //   );
  //   it.todo(
  //     'operation creation result is attached to entry via updateOperations',
  //   );
  // });

  // describe('entryRepository integration', () => {
  //   it.todo(
  //     'updateEntryMetadata loads new entry from persistence and attaches operations',
  //   );
  //   it.todo('does not lose operations after metadata rewrite');
  // });

  // describe('transaction updates', () => {
  //   it.todo('transaction.removeEntries is called with correct IDs');
  //   it.todo('transaction.addEntries is called with newly created entries');
  //   it.todo('final transaction contains correct set of entries');
  // });

  // describe('error handling', () => {
  //   it.todo(
  //     'ignores update when entry not found in transaction (current behavior)',
  //   );
  //   // позже можно заменить на it('throws...')
  // });
});
