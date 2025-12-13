import { UUID } from '@ledgerly/shared/types';
import {
  AccountDbRow,
  EntryDbRow,
  OperationDbRow,
  UserDbRow,
} from 'src/db/schema';
import { compareEntities } from 'src/db/test-utils';
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
  let anotherEntry: EntryDbRow;
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
    anotherEntry = await testDB.createEntry(user.id);
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

      const voidedOperations = await operationRepository.voidByEntryIds(
        user.id,
        [entry.id],
      );

      expect(voidedOperations).toHaveLength(1);

      expect(voidedOperations[0]).toEqual(
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

      const voidedOperations = await operationRepository.voidByEntryIds(
        user.id,
        [anotherEntry.id],
      );

      expect(voidedOperations).toHaveLength(0);
    });
  });

  describe('voidByEntryIds', () => {
    it('should soft delete operations by a single entry ID', async () => {
      const entryForDeletingData = [
        {
          accountId: account2.id,
          amount: Amount.create('400').valueOf(),
          description: 'Operation to be soft deleted by single entry ID',
          entryId: entry.id,
        },
        {
          accountId: account1.id,
          amount: Amount.create('600').valueOf(),
          description: 'Another operation for the same entry',
          entryId: entry.id,
        },
      ];

      const operationsToBeDeleted = await Promise.all(
        entryForDeletingData.map((opData) =>
          testDB.createOperation(user.id, opData),
        ),
      );

      const operationsBeforeVoiding = new Map<UUID, OperationDbRow>();

      operationsToBeDeleted.forEach((op) =>
        operationsBeforeVoiding.set(op.id, op),
      );

      const thirdOperation = await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('600').valueOf(),
        description: 'Another operation for the same entry',
        entryId: anotherEntry.id,
      });

      const voidedOperations = await operationRepository.voidByEntryId(
        user.id,
        entry.id,
      );

      voidedOperations.forEach((voidedOp) => {
        const originalOp = operationsBeforeVoiding.get(voidedOp.id);

        if (!originalOp) {
          throw new Error(
            `Operation with ID ${voidedOp.id} was not expected to be voided.`,
          );
        }

        expect(voidedOp.isTombstone).toBe(true);

        compareEntities(originalOp, voidedOp, ['updatedAt', 'isTombstone']);
      });

      const unVoidedOperation = await testDB.getOperationById(
        thirdOperation.id,
      );

      expect(unVoidedOperation?.isTombstone).toBe(false);

      const voidedOperationsDBrows = await testDB.getOperationsByEntryId(
        user.id,
        entry.id,
      );

      expect(voidedOperationsDBrows).toHaveLength(voidedOperations.length);

      const fetchedOperations = await operationRepository.getByEntryId(
        user.id,
        entry.id,
      );

      fetchedOperations.forEach((fetchedOp) => {
        expect(fetchedOp.isTombstone).toBe(true);

        const originalOp = operationsBeforeVoiding.get(fetchedOp.id);

        if (!originalOp) {
          throw new Error(
            `Operation with ID ${fetchedOp.id} was not expected to be voided.`,
          );
        }

        compareEntities(originalOp, fetchedOp, ['isTombstone', 'updatedAt']);
      });
    });
  });
});
