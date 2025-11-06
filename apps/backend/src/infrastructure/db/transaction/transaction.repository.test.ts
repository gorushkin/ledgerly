import { TransactionDbInsert, UserDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { DateValue } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { Timestamp } from 'src/domain/domain-core/value-objects/Timestamp';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionManager } from '../TransactionManager';

import { TransactionRepository } from './transaction.repository';

describe('TransactionRepository', () => {
  let testDB: TestDB;
  let transactionRepository: TransactionRepository;
  let user: UserDbRow;

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    user = await testDB.createUser();

    transactionRepository = new TransactionRepository(
      testDB.db,
      transactionManager as unknown as TransactionManager,
    );
  });

  it('should create a transaction successfully', async () => {
    const createdAt = Timestamp.create().valueOf();
    const updatedAt = Timestamp.create().valueOf();
    const id = Id.create().valueOf();
    const postingDate = DateValue.create().valueOf();
    const transactionDate = DateValue.create().valueOf();

    const transactionData: TransactionDbInsert = {
      createdAt,
      description: 'Test transaction',
      id,
      isTombstone: false,
      postingDate,
      transactionDate,
      updatedAt,
      userId: user.id,
    };

    const result = await transactionRepository.create(transactionData);

    expect(result).toEqual(transactionData);
  });
});
