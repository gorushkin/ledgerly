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
      testDB.db,
      transactionManager as unknown as TransactionManager,
    );
  });

  it('should create an entry successfully', async () => {
    const userId = user.id;
    const transactionId = transaction.id;

    const createdAt = Timestamp.create().valueOf();
    const updatedAt = Timestamp.create().valueOf();
    const id = Id.create().valueOf();

    const expectedResult: EntryDbRow = {
      createdAt,
      id,
      transactionId,
      updatedAt,
      userId,
    };

    const entry = await entryRepository.create({
      createdAt,
      id,
      transactionId,
      updatedAt,
      userId,
    });

    expect(entry).toEqual(expectedResult);
  });
});
