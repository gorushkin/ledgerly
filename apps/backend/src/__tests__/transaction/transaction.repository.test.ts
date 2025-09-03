import { UsersResponseDTO, UUID } from '@ledgerly/shared/types';
import { TransactionDbInsert } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
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
    hash: `hash-${Math.random().toString(36).substring(2, 15)}`,
    postingDate: TestDB.isoDateString,
    transactionDate: TestDB.isoDateString,
    userId: userId,
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

  let createdTransactions: TransactionDbInsert[];

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

    createdTransactions = await Promise.all(
      transactionsToAdd.map(testDB.createTransaction),
    );
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

  describe('getTransactionById', () => {
    it('should return transaction by id and userId', async () => {
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      const allTransactions = await Promise.all(promises);

      const transactionId = allTransactions[0].id;
      const transactionUserId = allTransactions[0].userId;
      const transactionDescription = allTransactions[0].description;

      const transaction = await transactionRepository.getById(
        transactionUserId,
        transactionId,
      );

      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe(transactionId);
      expect(transaction?.userId).toBe(transactionUserId);
      expect(transaction?.description).toBe(transactionDescription);
      expect(transaction?.hash).toBeDefined();
    });

    it('should throw NotFoundError if for a non-existing transaction', async () => {
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      await Promise.all(promises);

      const nonExistingTransactionId = 'non-existing-id' as UUID;
      const userId = user1.id;

      const transaction = transactionRepository.getById(
        userId,
        nonExistingTransactionId,
      );

      await expect(transaction).rejects.toThrowError(NotFoundError);
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

    it('should throw NotFoundError if user does not own the transaction', async () => {
      await Promise.all(
        user1TransactionData.map((params) => testDB.createTransaction(params)),
      );

      const secondUserTransactions = await Promise.all(
        user2TransactionData.map((params) => testDB.createTransaction(params)),
      );

      const nonOwnerUserId = user1.id;
      const transactionId = secondUserTransactions[0].id;

      const transaction = transactionRepository.getById(
        nonOwnerUserId,
        transactionId,
      );

      await expect(transaction).rejects.toThrowError(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update a transaction with valid data', async () => {
      const transactionToUpdate = createdTransactions[0];

      const postingData = TestDB.isoDateString;

      const updatedData = {
        description: 'Updated transaction description',
        id: transactionToUpdate.id,
        postingDate: postingData,
        transactionDate: postingData,
        userId: transactionToUpdate.userId,
      };

      const updatedTransaction = await transactionRepository.update(
        user1.id,
        transactionToUpdate.id,
        { ...transactionToUpdate, ...updatedData },
      );

      expect(updatedTransaction).toBeDefined();
      expect(updatedTransaction?.id).toBe(transactionToUpdate.id);
      expect(updatedTransaction?.description).toBe(updatedData.description);
      expect(updatedTransaction?.userId).toBe(transactionToUpdate.userId);

      expect(updatedTransaction).toMatchObject({
        createdAt: transactionToUpdate.createdAt,
        description: updatedData.description,
        id: transactionToUpdate.id,
        postingDate: updatedData.postingDate,
        transactionDate: updatedData.transactionDate,
        userId: transactionToUpdate.userId,
      });

      const updatedTransactionFromTestDB = await testDB.getTransactionById(
        transactionToUpdate.id,
      );

      expect(updatedTransactionFromTestDB).toEqual(updatedTransaction);
    });
  });

  describe('delete', () => {
    it('should soft delete transaction', async () => {
      const transactionToDelete = createdTransactions[0];

      const result = await transactionRepository.delete(
        user1.id,
        transactionToDelete.id,
      );

      expect(result).toBe(true);

      const deletedTransaction = await testDB.getTransactionById(
        transactionToDelete.id,
      );

      expect(deletedTransaction).toMatchObject({
        createdAt: transactionToDelete.createdAt,
        description: transactionToDelete.description,
        id: transactionToDelete.id,
        isTombstone: true,
        postingDate: transactionToDelete.postingDate,
        transactionDate: transactionToDelete.transactionDate,
        userId: transactionToDelete.userId,
      });
    });

    it('should return false when deleting already deleted transaction', async () => {
      const transactionToDelete = createdTransactions[0];

      const firstDeleteResult = await transactionRepository.delete(
        user1.id,
        transactionToDelete.id,
      );

      expect(firstDeleteResult).toBe(true);

      const secondDeleteResult = await transactionRepository.delete(
        user1.id,
        transactionToDelete.id,
      );

      expect(secondDeleteResult).toBe(false);
    });

    it('should return false when deleting non-existing transaction', async () => {
      const nonExistingTransactionId = 'non-existing-id' as UUID;

      const deleteResult = await transactionRepository.delete(
        user1.id,
        nonExistingTransactionId,
      );

      expect(deleteResult).toBe(false);
    });
  });

  describe('restore', () => {
    it('should restore transaction', async () => {
      const transactionToDelete = createdTransactions[0];

      await testDB.updateTransaction(transactionToDelete.id, {
        isTombstone: true,
      });

      const result = await transactionRepository.restore(
        user1.id,
        transactionToDelete.id,
      );

      expect(result).toBe(true);

      const restoredTransaction = await testDB.getTransactionById(
        transactionToDelete.id,
      );

      expect(restoredTransaction).toMatchObject({
        createdAt: transactionToDelete.createdAt,
        description: transactionToDelete.description,
        id: transactionToDelete.id,
        isTombstone: false,
        postingDate: transactionToDelete.postingDate,
        transactionDate: transactionToDelete.transactionDate,
        userId: transactionToDelete.userId,
      });
    });
  });

  // TODO: add all missing tests for transactions
});
