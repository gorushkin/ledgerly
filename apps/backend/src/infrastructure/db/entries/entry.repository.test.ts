import { UUID } from '@ledgerly/shared/types';
import { EntryMapper } from 'src/application';
import { EntryDbRow, UserDbRow } from 'src/db/schema';
import { compareEntities, TransactionBuilder } from 'src/db/test-utils';
import { Transaction, User } from 'src/domain';
import { Id, Timestamp } from 'src/domain/domain-core';
import { EntrySnapshot } from 'src/domain/entries/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

import { EntryRepository } from './entry.repository';

describe('EntryRepository', () => {
  let testDB: TestDB;
  let entryRepository: EntryRepository;
  let user: UserDbRow;
  let transaction: Transaction;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    user = await testDB.createUser();

    const transactionBuilder = TransactionBuilder.create(
      User.fromPersistence(user),
    );

    const entriesData = [
      {
        description: 'First Entry',
        operations: [
          { accountKey: 'USD', amount: '10000', description: '1' },
          { accountKey: 'USD', amount: '-10000', description: '2' },
        ],
      },
      {
        description: 'Second Entry',
        operations: [
          { accountKey: 'USD', amount: '20000', description: '1' },
          { accountKey: 'USD', amount: '-20000', description: '2' },
        ],
      },
      {
        description: 'Third Entry',
        operations: [
          { accountKey: 'USD', amount: '20000', description: '1' },
          { accountKey: 'USD', amount: '-20000', description: '2' },
        ],
      },
    ];

    const data = transactionBuilder
      .withAccounts(['USD', 'EUR'])
      .withEntries(entriesData)
      .withSystemAccounts()
      .build();

    transaction = data.transaction;

    await testDB.insertTransaction(transaction.toSnapshot());

    entryRepository = new EntryRepository(
      transactionManager as unknown as TransactionManager,
    );
  });

  describe('save', () => {
    it('should create a new entry if it does not exist', async () => {
      const entries = transaction
        .getEntries()
        .map((entry) => EntryMapper.toDBRow(entry));

      const fetchedEntriesBeforeSaving = await Promise.all(
        entries.map((entry) => testDB.getEntryById(entry.id)),
      );

      const transactionWithRelations = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(transactionWithRelations?.entries).toHaveLength(0);

      expect(fetchedEntriesBeforeSaving.every((e) => e === null)).toBe(true);

      await entryRepository.save(
        user.id,
        entries,
        new Map<UUID, EntrySnapshot>(),
      );

      const fetchedEntries = await Promise.all(
        entries.map((entry) => testDB.getEntryById(entry.id)),
      );

      fetchedEntries.forEach((fetchedEntry, index) => {
        expect(fetchedEntry).toBeDefined();
        compareEntities<EntryDbRow>(entries[index], fetchedEntry!);
      });
    });

    it('should update an existing entry and do not touch other entries', async () => {
      const entries = transaction
        .getEntries()
        .map((entry) => EntryMapper.toDBRow(entry));

      const entriesSnapshots = new Map<UUID, EntrySnapshot>();

      await entryRepository.save(user.id, entries, entriesSnapshots);

      const entriesToUpdate = [entries[0], entries[1]];
      const entryToUpdateId = entriesToUpdate.map((e) => e.id);

      const entriesToUpdateData = [
        {
          ...entriesToUpdate[0],
          description: 'Updated Entry One',
        },
        {
          ...entriesToUpdate[1],
          description: 'Updated Entry Two',
        },
      ];

      const snapshot = transaction.toSnapshot();

      snapshot?.entries.forEach((entrySnapshot) => {
        entriesSnapshots.set(entrySnapshot.id, entrySnapshot);
      });

      await entryRepository.save(
        user.id,
        entriesToUpdateData,
        entriesSnapshots,
      );

      const fetchedEntries = await Promise.all(
        entries.map((entry) => testDB.getEntryById(entry.id)),
      );

      entries.forEach((entry) => {
        const expectedEntry = entryToUpdateId.includes(entry.id)
          ? entriesToUpdateData.find((e) => e.id === entry.id)
          : entry;

        const fetchedEntry = fetchedEntries.find((e) => e?.id === entry.id);

        if (!expectedEntry) {
          throw new Error('Expected entry not found');
        }

        expect(fetchedEntry).toBeDefined();
        compareEntities<EntryDbRow>(expectedEntry, fetchedEntry!, [
          'updatedAt',
        ]);
      });
    });

    it('should soft delete an entry and do not touch other entries', async () => {
      const entries = transaction
        .getEntries()
        .map((entry) => EntryMapper.toDBRow(entry));

      const entriesSnapshots = new Map<UUID, EntrySnapshot>();

      await entryRepository.save(user.id, entries, entriesSnapshots);

      const entryToDelete = entries[0];
      const entryToDeleteId = entryToDelete.id;

      const snapshot = transaction.toSnapshot();

      snapshot?.entries.forEach((entrySnapshot) => {
        entriesSnapshots.set(entrySnapshot.id, entrySnapshot);
      });

      const entryToDeleteData = {
        ...entryToDelete,
        isTombstone: true,
      };

      await entryRepository.save(
        user.id,
        [entryToDeleteData],
        entriesSnapshots,
      );

      const fetchedEntries = await Promise.all(
        entries.map((entry) => testDB.getEntryById(entry.id)),
      );

      entries.forEach((entry) => {
        const expectedEntry =
          entry.id === entryToDeleteId ? entryToDeleteData : entry;

        const fetchedEntry = fetchedEntries.find((e) => e?.id === entry.id);

        expect(fetchedEntry).toBeDefined();
        compareEntities<EntryDbRow>(expectedEntry, fetchedEntry!, [
          'updatedAt',
        ]);
      });
    });

    it('should create, update and delete entries in a single save operation', async () => {
      const entries = transaction
        .getEntries()
        .map((entry) => EntryMapper.toDBRow(entry));

      const entriesSnapshots = new Map<UUID, EntrySnapshot>();

      await entryRepository.save(user.id, entries, entriesSnapshots);

      const entryToUpdate = entries[0];
      const entryToDelete = entries[1];

      const entryToUpdateData = {
        ...entryToUpdate,
        description: 'Updated Entry',
      };

      const entryToDeleteData = {
        ...entryToDelete,
        isTombstone: true,
      };

      const newEntryData: EntryDbRow = {
        createdAt: Timestamp.create().valueOf(),
        description: 'New Entry',
        id: Id.create().valueOf(),
        isTombstone: false,
        transactionId: transaction.getId().valueOf(),
        updatedAt: Timestamp.create().valueOf(),
        userId: user.id,
        version: 0,
      };

      const snapshot = transaction.toSnapshot();

      snapshot?.entries.forEach((entrySnapshot) => {
        entriesSnapshots.set(entrySnapshot.id, entrySnapshot);
      });

      await entryRepository.save(
        user.id,
        [entryToUpdateData, entryToDeleteData, newEntryData],
        entriesSnapshots,
      );

      const fetchedEntries = await Promise.all([
        ...entries.map((entry) => testDB.getEntryById(entry.id)),
        testDB.getEntryById(newEntryData.id),
      ]);

      entries.forEach((entry) => {
        const expectedEntry =
          entry.id === entryToUpdateData.id
            ? entryToUpdateData
            : entry.id === entryToDeleteData.id
              ? entryToDeleteData
              : entry;

        const fetchedEntry = fetchedEntries.find((e) => e?.id === entry.id);

        expect(fetchedEntry).toBeDefined();
        compareEntities<EntryDbRow>(expectedEntry, fetchedEntry!, [
          'updatedAt',
        ]);
      });

      const fetchedNewEntry = fetchedEntries.find(
        (e) => e?.id === newEntryData.id,
      );

      expect(fetchedNewEntry).toBeDefined();
      compareEntities<EntryDbRow>(newEntryData, fetchedNewEntry!, [
        'updatedAt',
      ]);
    });

    it('should update multiple entries with different descriptions in bulk', async () => {
      const entries = transaction
        .getEntries()
        .map((entry) => EntryMapper.toDBRow(entry));

      const entriesSnapshots = new Map<UUID, EntrySnapshot>();

      await entryRepository.save(user.id, entries, entriesSnapshots);

      const snapshot = transaction.toSnapshot();

      snapshot?.entries.forEach((entrySnapshot) => {
        entriesSnapshots.set(entrySnapshot.id, entrySnapshot);
      });

      const updatedEntries = entries.map((entry, index) => ({
        ...entry,
        description: `Bulk Updated Entry ${index + 1}`,
      }));

      await entryRepository.save(user.id, updatedEntries, entriesSnapshots);

      const fetchedEntries = await Promise.all(
        entries.map((entry) => testDB.getEntryById(entry.id)),
      );

      updatedEntries.forEach((expectedEntry, index) => {
        const fetchedEntry = fetchedEntries.find(
          (e) => e?.id === expectedEntry.id,
        );

        expect(fetchedEntry).toBeDefined();
        expect(fetchedEntry?.description).toBe(
          `Bulk Updated Entry ${index + 1}`,
        );
        compareEntities<EntryDbRow>(expectedEntry, fetchedEntry!, [
          'updatedAt',
        ]);
      });
    });
  });
});
