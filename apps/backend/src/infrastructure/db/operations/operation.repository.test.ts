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
  let account: AccountDbRow;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    operationRepository = new OperationRepository(
      transactionManager as unknown as TransactionManager,
    );

    user = await testDB.createUser();

    account = await testDB.createAccount(user.id);

    entry = await testDB.createEntry(user.id);
  });

  it('should create an operation successfully', async () => {
    const accountId = account.id;
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
