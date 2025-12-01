import {
  AccountDbRow,
  EntryDbRow,
  TransactionDbInsert,
  UserDbRow,
} from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { Amount, DateValue } from 'src/domain/domain-core';
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
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => cb()),
  };

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    user = await testDB.createUser();

    transactionRepository = new TransactionRepository(
      transactionManager as unknown as TransactionManager,
    );
  });

  describe('create', () => {
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

  describe('getById', () => {
    it('should retrieve a transaction by ID', async () => {
      const transaction = await testDB.createTransaction(user.id);

      const fetchedTransaction = await transactionRepository.getById(
        user.id,
        transaction.id,
      );

      expect(fetchedTransaction).toEqual({ ...transaction, entries: [] });
    });

    it('should return null if transaction not found', async () => {
      const fetchedTransaction = await transactionRepository.getById(
        user.id,
        Id.create().valueOf(),
      );

      expect(fetchedTransaction).toBeNull();
    });
  });

  describe('getAll', () => {
    let account1: AccountDbRow;
    let account2: AccountDbRow;
    let account3: AccountDbRow;

    let transaction1: TransactionDbInsert;
    let transaction2: TransactionDbInsert;

    let entry1Transaction1: EntryDbRow;
    let entry2Transaction1: EntryDbRow;
    let entry1Transaction2: EntryDbRow;

    beforeEach(async () => {
      account1 = await testDB.createAccount(user.id, { name: 'Account 1' });
      account2 = await testDB.createAccount(user.id, { name: 'Account 2' });
      account3 = await testDB.createAccount(user.id, { name: 'Account 3' });
      await testDB.createAccount(user.id, { name: 'Account 4' });

      transaction1 = await testDB.createTransaction(user.id);
      transaction2 = await testDB.createTransaction(user.id);
      await testDB.createTransaction(user.id);

      entry1Transaction1 = await testDB.createEntry(user.id, {
        transactionId: transaction1.id,
      });

      entry2Transaction1 = await testDB.createEntry(user.id, {
        transactionId: transaction1.id,
      });

      entry1Transaction2 = await testDB.createEntry(user.id, {
        transactionId: transaction2.id,
      });

      await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('100').valueOf(),
        description: 'Test Operation 1',
        entryId: entry1Transaction1.id,
      });

      await testDB.createOperation(user.id, {
        accountId: account2.id,
        amount: Amount.create('-100').valueOf(),
        description: 'Test Operation 2',
        entryId: entry1Transaction1.id,
      });

      await testDB.createOperation(user.id, {
        accountId: account3.id,
        amount: Amount.create('50').valueOf(),
        description: 'Test Operation 3',
        entryId: entry2Transaction1.id,
      });

      await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('-50').valueOf(),
        description: 'Test Operation 4',
        entryId: entry2Transaction1.id,
      });

      await testDB.createOperation(user.id, {
        accountId: account1.id,
        amount: Amount.create('200').valueOf(),
        description: 'Test Operation 5',
        entryId: entry1Transaction2.id,
      });

      await testDB.createOperation(user.id, {
        accountId: account2.id,
        amount: Amount.create('-200').valueOf(),
        description: 'Test Operation 6',
        entryId: entry1Transaction2.id,
      });
    });

    it('should retrieve transactions by account ID', async () => {
      const operationsByAccount1 = await testDB.getOperationsByAccountId(
        user.id,
        account1.id,
      );

      const transactions = await transactionRepository.getAll(user.id, {
        accountId: account1.id,
      });

      const ids = transactions.flatMap((tx) =>
        tx.entries.flatMap((entry) => entry.operations.map((op) => op.id)),
      );

      operationsByAccount1.forEach((op) => {
        expect(ids).toContain(op.id);

        const matchingOp = transactions
          .flatMap((tx) => tx.entries)
          .flatMap((entry) => entry.operations)
          .find((operation) => operation.id === op.id);

        expect(matchingOp).toBeDefined();
        expect(matchingOp).toEqual(op);
      });

      expect(transactions.length).toBe(2);
    });

    it('should return empty array if no transactions found for account ID', async () => {
      const transactions = await transactionRepository.getAll(user.id, {
        accountId: Id.create().valueOf(),
      });

      expect(transactions).toEqual([]);
    });

    it('should not return transactions for other users', async () => {
      const otherUser = await testDB.createUser();

      const account = await testDB.createAccount(otherUser.id, {
        name: 'Other User Account',
      });

      const transactions = await transactionRepository.getAll(user.id, {
        accountId: account.id,
      });

      expect(transactions).toEqual([]);
    });
  });

  describe('update', () => {
    it('should update a transaction successfully', async () => {
      const transaction = await testDB.createTransaction(user.id, {
        description: 'Old Description',
        postingDate: DateValue.restore('2023-01-01').valueOf(),
        transactionDate: DateValue.restore('2023-01-02').valueOf(),
      });

      const updatedData = {
        description: 'New Description',
        postingDate: DateValue.restore('2024-01-01').valueOf(),
        transactionDate: DateValue.restore('2024-01-02').valueOf(),
      };

      const updatedTransaction = await transactionRepository.update(
        user.id,
        transaction.id,
        updatedData,
      );

      expect(updatedTransaction.description).toBe(updatedData.description);
      expect(updatedTransaction.postingDate).toBe(updatedData.postingDate);
      expect(updatedTransaction.transactionDate).toBe(
        updatedData.transactionDate,
      );
    });
  });
});
