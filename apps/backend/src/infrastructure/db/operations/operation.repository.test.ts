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

      const expectedResult: OperationDbRow = {
        accountId,
        amount: amount.valueOf(),
        createdAt,
        description: 'Test operation',
        entryId,
        id,
        isTombstone: false,
        updatedAt,
        userId,
      };

      const result = await operationRepository.create({
        accountId,
        amount: amount.valueOf(),
        createdAt,
        description: 'Test operation',
        entryId,
        id,
        isTombstone: false,
        updatedAt: updatedAt,
        userId,
      });

      expect(result).toEqual(expectedResult);
    });
  });

  describe('getByEntryId', () => {
    it('should retrieve operations by entry ID', async () => {
      const operation1 = await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('500').valueOf(),
        description: 'Operation for entry',
        entryId: entry.id,
      });

      const operation2 = await testDB.createOperation(user.id, {
        accountId: account2.id,
        amount: Amount.create('300').valueOf(),
        description: 'Another operation for entry',
        entryId: entry.id,
      });

      const operations = await operationRepository.getByEntryId(entry.id);

      expect(operations).toHaveLength(2);
      expect(operations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: operation1.id }),
          expect.objectContaining({ id: operation2.id }),
        ]),
      );
    });
  });
});
