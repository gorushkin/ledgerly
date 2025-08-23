import { UsersResponseDTO, UUID } from '@ledgerly/shared/types';
import { TransactionDbInsert } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { TxType } from 'src/types';
import { beforeEach, describe, expect, it } from 'vitest';
type TestDBTransactionParams = Omit<
  TransactionDbInsert,
  'id' | 'createdAt' | 'updatedAt'
>;

const getUserTransactionDTO = (params: {
  userId: UUID;
  description?: string;
}): TestDBTransactionParams => {
  const { description, userId } = params;

  return {
    description: description,
    // ...TestDB.createTimestamps,
    // ...TestDB.uuid,
    hash: `hash-${'sss'}`,
    isTombstone: false,
    postingDate: new Date().toString(),
    transactionDate: new Date().toString(),
    userId,
  };
};

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let user1: UsersResponseDTO;
  let user2: UsersResponseDTO;
  let user3: UsersResponseDTO;
  let testDB: TestDB;

  let user1TransactionData: TestDBTransactionParams[];
  let user2TransactionData: TestDBTransactionParams[];
  let transactionsToAdd: TestDBTransactionParams[];

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    transactionRepository = new TransactionRepository(testDB.db);

    user1 = await testDB.createUser();
    user2 = await testDB.createUser({});
    user3 = await testDB.createUser({});

    const user1TransactionDTO_1 = getUserTransactionDTO({
      description: 'User 1 Transaction 1',
      userId: user1.id,
    });

    const user1TransactionDTO_2 = getUserTransactionDTO({
      description: 'User 1 Transaction 2',
      userId: user1.id,
    });

    user1TransactionData = [user1TransactionDTO_1, user1TransactionDTO_2];

    const user2TransactionDTO = getUserTransactionDTO({
      description: 'User 2 Transaction 1',
      userId: user2.id,
    });

    user2TransactionData = [user2TransactionDTO];

    transactionsToAdd = [...user1TransactionData, ...user2TransactionData];

    await Promise.all(transactionsToAdd.map(testDB.createTransaction));
  });

  describe('getAllByUserId', () => {
    it('should return all transactions for a specific user', async () => {
      const transactions = await transactionRepository.getAllByUserId(user1.id);
      expect(transactions).toHaveLength(user1TransactionData.length);
    });

    it('should return empty transactions for a specific user', async () => {
      const transactions = await transactionRepository.getAllByUserId(user3.id);
      expect(transactions).toHaveLength(0);
    });

    it('should return transactions for user 2', async () => {
      const transactions = await transactionRepository.getAllByUserId(user2.id);
      expect(transactions).toHaveLength(user2TransactionData.length);
    });

    it('should not return not owned transactions', async () => {
      const transactions = await transactionRepository.getAllByUserId(user1.id);

      const user2Transactions = await transactionRepository.getAllByUserId(
        user2.id,
      );

      expect(transactions).not.toEqual(user2Transactions);
    });
  });

  describe('create', () => {
    it('should create a new transaction with timestamps and id', async () => {
      const newTransaction = getUserTransactionDTO({
        description: 'New Transaction',
        userId: user1.id,
      });

      const createdTransaction = await transactionRepository.create(
        { ...newTransaction, ...TestDB.createTimestamps, ...TestDB.uuid },
        testDB.db as unknown as TxType,
      );

      expect(createdTransaction).toEqual(
        expect.objectContaining(newTransaction),
      );

      expect(createdTransaction.createdAt).toBeDefined();
      expect(createdTransaction.updatedAt).toBeDefined();
      expect(createdTransaction.id).toBeDefined();
    });
  });

  // describe('delete', () => {});

  // describe('getAll', () => {});

  // describe('getTransactionById', () => {});

  // describe('update', () => {});
});
