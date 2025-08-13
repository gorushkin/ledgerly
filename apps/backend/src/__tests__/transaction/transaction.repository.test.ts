import {
  AccountResponseDTO,
  OperationCreateDTO,
  UsersResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { generateId } from 'src/libs';
import { hashGenerator } from 'src/libs';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { TxType } from 'src/types';
import { beforeEach, describe, expect, it } from 'vitest';
type TestDBTransactionParams = {
  userId: UUID;
  data?: {
    description?: string;
    postingDate: string;
    transactionDate: string;
    userId: UUID;
    operations?: OperationCreateDTO[];
  };
};

const getUserTransactionDTO = (params: {
  testAccount1: AccountResponseDTO;
  testAccount2: AccountResponseDTO;
  userId: UUID;
  description?: string;
}): TestDBTransactionParams => {
  const { description, userId } = params;

  return {
    data: {
      description: description,
      operations: [],
      postingDate: new Date().toString(),
      transactionDate: new Date().toString(),
      userId: userId,
    },
    userId: userId,
  };
};

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let user: UsersResponseDTO;
  let testAccount1: AccountResponseDTO;
  let testAccount2: AccountResponseDTO;
  let testDB: TestDB;

  let firstUserTransactionData: TestDBTransactionParams[];
  let secondUserTransactionData: TestDBTransactionParams[];
  let transactionsToAdd: TestDBTransactionParams[];

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    transactionRepository = new TransactionRepository(testDB.db);

    user = await testDB.createUser();

    testAccount1 = await testDB.createAccount(user.id, {
      name: 'Test Account 1',
    });

    testAccount2 = await testDB.createAccount(user.id, {
      name: 'Test Account 2',
    });

    const secondUser = await testDB.createUser({});

    const firstUserTransactionDTO_1 = getUserTransactionDTO({
      description: 'User 1 Transaction 1',
      testAccount1,
      testAccount2,
      userId: user.id,
    });

    const firstUserTransactionDTO_2 = getUserTransactionDTO({
      description: 'User 1 Transaction 2',
      testAccount1,
      testAccount2,
      userId: user.id,
    });

    firstUserTransactionData = [
      firstUserTransactionDTO_1,
      firstUserTransactionDTO_2,
    ];

    const secondUserTransactionDTO = getUserTransactionDTO({
      description: 'User 2 Transaction 1',
      testAccount1,
      testAccount2,
      userId: secondUser.id,
    });

    secondUserTransactionData = [secondUserTransactionDTO];

    transactionsToAdd = [
      ...firstUserTransactionData,
      ...secondUserTransactionData,
    ];
  });

  describe('create', () => {
    it('should create a transaction with valid data with operations', async () => {
      const transactionData = {
        description: 'Test transaction',
        id: generateId(),
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: user.id,
      };

      const createdTransaction = await transactionRepository.create(
        hashGenerator.getTransactionWithHash(transactionData),
        testDB.db as unknown as TxType,
      );

      expect(createdTransaction).toHaveProperty('id');
      expect(createdTransaction.userId).toBe(user.id);
      expect(createdTransaction.description).toBe('Test transaction');
      expect(createdTransaction.hash).toBeDefined();
    });

    it('sets createdAt and updatedAt timestamps', async () => {
      const transactionData = {
        description: 'Test transaction with timestamps',
        id: generateId(),
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: user.id,
      };

      const createdTransaction = await transactionRepository.create(
        hashGenerator.getTransactionWithHash(transactionData),
        testDB.db as unknown as TxType,
      );

      expect(createdTransaction).toHaveProperty('id');
      expect(createdTransaction.userId).toBe(user.id);
      expect(createdTransaction.description).toBe(
        'Test transaction with timestamps',
      );
      expect(createdTransaction.hash).toBeDefined();
      expect(createdTransaction.createdAt).toBeDefined();
      expect(createdTransaction.updatedAt).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should delete a transaction by id with operations', async () => {
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      const allTransactions = await Promise.all(promises);

      const idTransactionToDelete = allTransactions[0].id;

      const transactionToBeDeleted = await testDB.getTransactionById(
        idTransactionToDelete,
      );

      expect(transactionToBeDeleted).toBeDefined();
      expect(allTransactions).toHaveLength(transactionsToAdd.length);

      await transactionRepository.delete(user.id, idTransactionToDelete);

      const retrievedDeletedTransaction = await testDB.getTransactionById(
        idTransactionToDelete,
      );

      expect(retrievedDeletedTransaction).toBeUndefined();
    });

    it('does nothing if transaction does not exist (no error)', async () => {
      const result = transactionRepository.delete(user.id, 'non-existing-id');

      await expect(result).rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError if transaction does not belong to user', async () => {
      await Promise.all(
        firstUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const secondUserTransactions = await Promise.all(
        secondUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const nonOwnerUserId = user.id;
      const transactionId = secondUserTransactions[0].id;

      const deleteNonOwnerTransaction = transactionRepository.delete(
        nonOwnerUserId,
        transactionId,
      );

      await expect(deleteNonOwnerTransaction).rejects.toThrowError(
        NotFoundError,
      );
    });
  });

  describe('getAllByUserId', () => {
    it('should return all transactions for a specific user', async () => {
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      await Promise.all(promises);

      const userId = user.id;

      const transactions = await transactionRepository.getAllByUserId(userId);

      expect(transactions).toHaveLength(firstUserTransactionData.length);

      const initedUserTransactionDescriptionsSet = new Set<string>(
        firstUserTransactionData.map((tx) => tx.data?.description ?? ''),
      );

      expect(initedUserTransactionDescriptionsSet.size).toBe(
        firstUserTransactionData.length,
      );

      transactions.forEach((transaction) => {
        expect(transaction.userId).toBe(userId);
        expect(
          initedUserTransactionDescriptionsSet.has(transaction.description),
        ).toBe(true);
      });
    });

    it('returns empty array for user with no transactions', async () => {
      const userId = user.id;

      const transactions = await transactionRepository.getAllByUserId(userId);

      expect(transactions).toEqual([]);
    });

    it.todo('return transactions sorted by createdAt with pagination');
    it.todo('return transactions filtered by accountId');
  });

  describe('getAll', () => {
    it('should return all transactions for all users', async () => {
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      await Promise.all(promises);

      const transactions = await transactionRepository.getAll();

      expect(transactions).toHaveLength(transactionsToAdd.length);

      const initedUserTransactions = transactionsToAdd;

      const initedUserTransactionDescriptionsSet = new Set<string>(
        initedUserTransactions.map((tx) => tx.data?.description ?? ''),
      );

      expect(initedUserTransactionDescriptionsSet.size).toBe(
        initedUserTransactions.length,
      );

      transactions.forEach((transaction) => {
        expect(
          initedUserTransactionDescriptionsSet.has(transaction.description),
        ).toBe(true);
      });
    });

    it('returns empty array if no transactions exist', async () => {
      const transactions = await transactionRepository.getAll();
      expect(transactions).toEqual([]);
      expect(transactions).toHaveLength(0);
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

    it('should return undefined for a non-existing transaction', async () => {
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      await Promise.all(promises);

      const nonExistingTransactionId = 'non-existing-id' as UUID;
      const userId = user.id;

      const transaction = transactionRepository.getById(
        userId,
        nonExistingTransactionId,
      );

      await expect(transaction).rejects.toThrowError(NotFoundError);
    });

    it('returns undefined if user does not own the transaction', async () => {
      await Promise.all(
        firstUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const secondUserTransactions = await Promise.all(
        secondUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const nonOwnerUserId = user.id;
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
      const promises = transactionsToAdd.map((params) =>
        testDB.createTransaction(params),
      );

      const allTransactions = await Promise.all(promises);

      const transactionToUpdate = allTransactions[0];

      const updatedData = {
        description: 'Updated transaction description',
        id: transactionToUpdate.id,
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: transactionToUpdate.userId,
      };

      const transactionsExcludingUpdateBeforeUpdating = allTransactions.filter(
        (tx) => tx.id !== transactionToUpdate.id,
      );

      const updatedTransaction = await transactionRepository.update(
        user.id,
        transactionToUpdate.id,
        hashGenerator.getTransactionWithHash(updatedData),
      );

      expect(updatedTransaction).toBeDefined();
      expect(updatedTransaction?.id).toBe(transactionToUpdate.id);
      expect(updatedTransaction?.description).toBe(updatedData.description);
      expect(updatedTransaction?.userId).toBe(transactionToUpdate.userId);

      const updatedTransactionFromDB = await testDB.getTransactionById(
        transactionToUpdate.id,
      );

      expect(updatedTransactionFromDB).toBeDefined();
      expect(updatedTransactionFromDB?.id).toBe(updatedTransaction?.id);
      expect(updatedTransactionFromDB?.description).toBe(
        updatedTransaction?.description,
      );
      expect(updatedTransactionFromDB?.userId).toBe(updatedTransaction?.userId);

      const allTransactionsAfterUpdate = await testDB.getAllTransactions();

      expect(allTransactionsAfterUpdate).toHaveLength(allTransactions.length);

      const transactionsExcludingUpdateAfterUpdating =
        allTransactionsAfterUpdate.filter(
          (tx) => tx.id !== transactionToUpdate.id,
        );

      transactionsExcludingUpdateAfterUpdating.forEach((tx) => {
        expect(tx).toBeDefined();
        expect(JSON.stringify(tx)).toBe(
          JSON.stringify(
            transactionsExcludingUpdateBeforeUpdating.find(
              (originalTx) => originalTx.id === tx.id,
            ),
          ),
        );
      });
    });

    it('returns undefined if transaction does not exist or belongs to another user', async () => {
      await Promise.all(
        firstUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const secondUserTransactions = await Promise.all(
        secondUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const nonExistingTransactionId = 'non-existing-id' as UUID;
      const userId = user.id;

      const transactionWithNonExistingId = transactionRepository.getById(
        userId,
        nonExistingTransactionId,
      );

      await expect(transactionWithNonExistingId).rejects.toThrowError(
        NotFoundError,
      );

      const nonOwnerUserId = user.id;
      const transactionId = secondUserTransactions[0].id;

      const nonOwnerUserTransaction = transactionRepository.getById(
        nonOwnerUserId,
        transactionId,
      );

      await expect(nonOwnerUserTransaction).rejects.toThrowError(NotFoundError);
    });

    it('updates updatedAt timestamp', async () => {
      const transactions = await Promise.all(
        firstUserTransactionData.map((params) =>
          testDB.createTransaction(params),
        ),
      );

      const transactionToUpdate = transactions[0];
      const updatedAtBeforeUpdate = transactionToUpdate.updatedAt;

      const transactionData = {
        description: 'Test transaction with timestamps',
        id: generateId(),
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: user.id,
      };

      const updatedTransaction = await transactionRepository.update(
        user.id,
        transactionToUpdate.id,
        hashGenerator.getTransactionWithHash(transactionData),
      );

      const updatedAtAfterUpdate = updatedTransaction?.updatedAt;

      expect(updatedTransaction).toBeDefined();
      expect(updatedAtAfterUpdate).toBeDefined();
      expect(updatedAtAfterUpdate).not.toBe(updatedAtBeforeUpdate);
    });
  });
});
