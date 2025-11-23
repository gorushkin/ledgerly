import { EntryDbRow, TransactionDbRow, UserDbRow } from 'src/db/schema';
import { Id, Timestamp } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

import { EntryRepository } from './entry.repository';

describe('EntryRepository', () => {
  let testDB: TestDB;
  let entryRepository: EntryRepository;
  let user: UserDbRow;
  let transaction: TransactionDbRow;

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
    transaction = await testDB.createTransaction(user.id);

    entryRepository = new EntryRepository(
      transactionManager as unknown as TransactionManager,
    );
  });

  describe('create', () => {
    it('should create an entry successfully', async () => {
      const userId = user.id;
      const transactionId = transaction.id;

      const createdAt = Timestamp.create().valueOf();
      const updatedAt = Timestamp.create().valueOf();
      const id = Id.create().valueOf();

      const entryInput: EntryDbRow = {
        createdAt,
        id,
        isTombstone: false,
        transactionId,
        updatedAt,
        userId,
      };

      const entry = await entryRepository.create(entryInput);

      expect(entry).toEqual(entryInput);
    });
  });

  describe('getByTransactionId', () => {
    it('should retrieve entries by transaction ID', async () => {
      const entry1 = await testDB.createEntry(user.id, {
        transactionId: transaction.id,
      });
      const entry2 = await testDB.createEntry(user.id, {
        transactionId: transaction.id,
      });

      const entries = await entryRepository.getByTransactionId(
        user.id,
        transaction.id,
      );

      expect(entries).toHaveLength(2);
      expect(entries).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: entry1.id }),
          expect.objectContaining({ id: entry2.id }),
        ]),
      );
    });

    it('should return an empty array if no entries found for the transaction ID', async () => {
      const anotherTransaction = await testDB.createTransaction(user.id);

      const entries = await entryRepository.getByTransactionId(
        user.id,
        anotherTransaction.id,
      );

      expect(entries).toHaveLength(0);
    });

    it('should not retrieve entries for a different user', async () => {
      const anotherUser = await testDB.createUser();

      const entries = await entryRepository.getByTransactionId(
        anotherUser.id,
        transaction.id,
      );

      expect(entries).toHaveLength(0);
    });

    it('should return an empty array when a non-existent transaction ID is provided', async () => {
      const nonExistentTransactionId = Id.create().valueOf();

      const entries = await entryRepository.getByTransactionId(
        user.id,
        nonExistentTransactionId,
      );

      expect(entries).toHaveLength(0);
    });
  });

  describe('softDeleteByTransactionId', () => {
    it('should mark entries as tombstone by transaction ID', async () => {
      const createdEntries = await Promise.all([
        testDB.createEntry(user.id, {
          transactionId: transaction.id,
        }),
        testDB.createEntry(user.id, {
          transactionId: transaction.id,
        }),
      ]);

      await entryRepository.softDeleteByTransactionId(user.id, transaction.id);

      const entries = await entryRepository.getByTransactionId(
        user.id,
        transaction.id,
      );

      expect(entries).toHaveLength(createdEntries.length);

      const deletedEntry1 = await testDB.getEntryById(createdEntries[0].id);
      const deletedEntry2 = await testDB.getEntryById(createdEntries[1].id);

      expect(deletedEntry1?.isTombstone).toBe(true);
      expect(deletedEntry2?.isTombstone).toBe(true);
    });

    it('should do nothing if no entries exist for the given transaction ID', async () => {
      const anotherTransaction = await testDB.createTransaction(user.id);

      await entryRepository.softDeleteByTransactionId(
        user.id,
        anotherTransaction.id,
      );

      const entries = await entryRepository.getByTransactionId(
        user.id,
        anotherTransaction.id,
      );

      expect(entries).toHaveLength(0);
    });
  });
});
