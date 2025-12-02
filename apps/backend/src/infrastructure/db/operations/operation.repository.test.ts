import {
  AccountDbRow,
  EntryDbRow,
  OperationDbRow,
  UserDbRow,
} from 'src/db/schema';
import { Amount, Id, Timestamp } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TestDB } from '../../../db/test-db';
import { TransactionManager } from '../TransactionManager';

import { OperationRepository } from './operation.repository';

describe('OperationRepository', () => {
  let testDB: TestDB;
  let operationRepository: OperationRepository;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  let user: UserDbRow;
  let entry: EntryDbRow;
  let account1: AccountDbRow;
  let account2: AccountDbRow;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    operationRepository = new OperationRepository(
      transactionManager as unknown as TransactionManager,
    );

    user = await testDB.createUser();

    account1 = await testDB.createAccount(user.id, { name: 'Account 1' });
    account2 = await testDB.createAccount(user.id, { name: 'Account 2' });

    entry = await testDB.createEntry(user.id);
  });

  describe('create', () => {
    it('should create an operation successfully', async () => {
      const accountId = account1.id;
      const userId = user.id;
      const entryId = entry.id;
      const amount = Amount.create('1000');
      const id = Id.create().valueOf();
      const createdAt = Timestamp.create().valueOf();
      const updatedAt = Timestamp.create().valueOf();
      const isSystem = false;
      const isTombstone = false;
      const description = 'Test operation';

      const expectedResult: OperationDbRow = {
        accountId,
        amount: amount.valueOf(),
        createdAt,
        description,
        entryId,
        id,
        isSystem,
        isTombstone,
        updatedAt,
        userId,
      };

      const result = await operationRepository.create({
        accountId,
        amount: amount.valueOf(),
        createdAt,
        description,
        entryId,
        id,
        isSystem,
        isTombstone,
        updatedAt,
        userId,
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getByEntryId', () => {
    let operation1: OperationDbRow;
    let operation2: OperationDbRow;

    beforeEach(async () => {
      operation1 = await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('500').valueOf(),
        description: 'Operation for entry',
        entryId: entry.id,
      });

      operation2 = await testDB.createOperation(user.id, {
        accountId: account2.id,
        amount: Amount.create('300').valueOf(),
        description: 'Another operation for entry',
        entryId: entry.id,
      });
    });

    it('should retrieve operations by entry ID', async () => {
      const operations = await operationRepository.getByEntryId(
        user.id,
        entry.id,
      );

      expect(operations).toHaveLength(2);
      expect(operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: operation1.id }),
          expect.objectContaining({ id: operation2.id }),
        ]),
      );
    });

    it('should return an empty array if no operations found for the entry ID', async () => {
      const anotherEntry = await testDB.createEntry(user.id);

      const operations = await operationRepository.getByEntryId(
        user.id,
        anotherEntry.id,
      );

      expect(operations).toHaveLength(0);
    });

    it('should not retrieve operations for a different user', async () => {
      const anotherUser = await testDB.createUser();

      const operations = await operationRepository.getByEntryId(
        anotherUser.id,
        entry.id,
      );

      expect(operations).toHaveLength(0);
    });

    it('should return an empty array if entry ID does not exist', async () => {
      const operations = await operationRepository.getByEntryId(
        user.id,
        Id.create().valueOf(),
      );

      expect(operations).toHaveLength(0);
    });
  });

  describe('softDeleteByEntryIds', () => {
    it('should soft delete operations by entry ID', async () => {
      const operation = await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('700').valueOf(),
        description: 'Operation to be soft deleted',
        entryId: entry.id,
      });

      const softDeletedOperations =
        await operationRepository.softDeleteByEntryIds(user.id, [entry.id]);

      expect(softDeletedOperations).toHaveLength(1);

      expect(softDeletedOperations[0]).toEqual(
        expect.objectContaining({
          id: operation.id,
          isTombstone: true,
        }),
      );

      const fetchedOperations = await operationRepository.getByEntryId(
        user.id,
        entry.id,
      );

      expect(fetchedOperations).toHaveLength(1);
      expect(fetchedOperations[0].isTombstone).toBe(true);
    });

    it('should return an empty array if no operations to soft delete for the entry ID', async () => {
      const anotherEntry = await testDB.createEntry(user.id);

      const softDeletedOperations =
        await operationRepository.softDeleteByEntryIds(user.id, [
          anotherEntry.id,
        ]);

      expect(softDeletedOperations).toHaveLength(0);
    });
  });
});
