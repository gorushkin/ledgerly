import {
  AccountResponse,
  CategoryResponse,
  OperationCreateDTO,
  TransactionCreateDTO,
  TransactionResponseDTO,
  UsersResponse,
  UUID,
} from '@ledgerly/shared/types';
import { eq } from 'node_modules/drizzle-orm/sql/expressions/index.cjs';
import { transactionsTable, operationsTable } from 'src/db/schemas';
import { TestDB } from 'src/db/test-db';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
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
  operationData?: {
    accountId?: UUID;
    categoryId?: UUID;
    description?: string;
    localAmount?: number;
    originalAmount?: number;
    userId: UUID;
  }[];
};

const getUserTransactionDTO = (params: {
  testAccount1: AccountResponse;
  testAccount2: AccountResponse;
  testCategory: CategoryResponse;
  userId: UUID;
  description?: string;
}): TestDBTransactionParams => {
  const { description, testAccount1, testAccount2, testCategory, userId } =
    params;

  return {
    data: {
      description: description,
      operations: [],
      postingDate: new Date().toString(),
      transactionDate: new Date().toString(),
      userId: userId,
    },
    operationData: [
      {
        accountId: testAccount1.id,
        categoryId: testCategory.id,
        userId: userId,
      },
      {
        accountId: testAccount2.id,
        categoryId: testCategory.id,
        userId: userId,
      },
    ],
    userId: userId,
  };
};

const getOperations = ({
  testAccount1,
  testAccount2,
  testCategory,
}: {
  testAccount1: AccountResponse;
  testAccount2: AccountResponse;
  testCategory: CategoryResponse;
  userId: UUID;
}): OperationCreateDTO[] => {
  const operation1Data = {
    accountId: testAccount1.id,
    categoryId: testCategory.id,
    description: 'Test operation',
    localAmount: 100,
    originalAmount: 100,
  };

  const operation2Data = {
    accountId: testAccount2.id,
    categoryId: testCategory.id,
    description: 'Test operation',
    localAmount: 100,
    originalAmount: 100,
  };

  return [operation1Data, operation2Data];
};

describe('TransactionRepository', () => {
  let transactionRepository: TransactionRepository;
  let operationRepository: OperationRepository;
  let user: UsersResponse;
  let testCategory: CategoryResponse;
  let testAccount1: AccountResponse;
  let testAccount2: AccountResponse;
  let testDB: TestDB;

  let initOperationsLength = 0;
  let userOneTransactionData: TestDBTransactionParams[];
  let transactionsToAdd: TestDBTransactionParams[];
  let allTransactions: TransactionResponseDTO[];

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    operationRepository = new OperationRepository(testDB.db);

    transactionRepository = new TransactionRepository(
      testDB.db,
      operationRepository,
    );

    user = await testDB.createUser();

    testCategory = await testDB.createTestCategory(user.id);

    testAccount1 = await testDB.createTestAccount(user.id, {
      name: 'Test Account 1',
    });

    testAccount2 = await testDB.createTestAccount(user.id, {
      name: 'Test Account 2',
    });

    const user2 = await testDB.createUser({});

    const user1Transaction1DTO = getUserTransactionDTO({
      description: 'User 1 Transaction 1',
      testAccount1,
      testAccount2,
      testCategory,
      userId: user.id,
    });

    const user1Transaction2DTO = getUserTransactionDTO({
      description: 'User 1 Transaction 2',
      testAccount1,
      testAccount2,
      testCategory,
      userId: user.id,
    });

    userOneTransactionData = [user1Transaction1DTO, user1Transaction2DTO];

    const userSecondeTransaction1DTO = getUserTransactionDTO({
      description: 'User 2 Transaction 1',
      testAccount1,
      testAccount2,
      testCategory,
      userId: user2.id,
    });

    transactionsToAdd = [...userOneTransactionData, userSecondeTransaction1DTO];

    initOperationsLength = transactionsToAdd.reduce(
      (acc, curr) => acc + (curr.operationData?.length ?? 0),
      0,
    );

    const promises = transactionsToAdd.map((params) =>
      testDB.createTestTransaction(params),
    );

    allTransactions = await Promise.all(promises);
  });

  describe('create', () => {
    it('should create a transaction with valid data with operations', async () => {
      const operations = getOperations({
        testAccount1,
        testAccount2,
        testCategory,
        userId: user.id,
      });

      const transactionData: TransactionCreateDTO = {
        description: 'Test transaction',
        operations,
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: user.id,
      };

      const createdTransaction =
        await transactionRepository.create(transactionData);

      expect(createdTransaction).toHaveProperty('id');
      expect(createdTransaction.userId).toBe(user.id);
      expect(createdTransaction.description).toBe('Test transaction');
      expect(createdTransaction.operations).toHaveLength(operations.length);

      createdTransaction.operations.forEach((op, index) => {
        expect(op.accountId).toBe(operations[index].accountId);
        expect(op.categoryId).toBe(operations[index].categoryId);
        expect(op.description).toBe(operations[index].description);
        expect(op.localAmount).toBe(operations[index].localAmount);
        expect(op.originalAmount).toBe(operations[index].originalAmount);
        expect(op.userId).toBe(transactionData.userId);
      });
    });

    it('should create a transaction without operations', async () => {
      const transactionData: TransactionCreateDTO = {
        description: 'Test transaction without operations',
        operations: [],
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: user.id,
      };

      const createdTransaction =
        await transactionRepository.create(transactionData);

      expect(createdTransaction).toHaveProperty('id');
      expect(createdTransaction.userId).toBe(user.id);
      expect(createdTransaction.description).toBe(
        'Test transaction without operations',
      );
      expect(createdTransaction.operations).toHaveLength(0);
    });
  });

  describe('delete', () => {
    it('should delete a transaction by id with operations', async () => {
      const operationsData = getOperations({
        testAccount1,
        testAccount2,
        testCategory,
        userId: user.id,
      });

      const allUsersTransactionsBeforeAdding = await testDB.db
        .select()
        .from(transactionsTable)
        .all();

      const allOperationsBeforeAdding = await testDB.db
        .select()
        .from(operationsTable)
        .all();

      expect(allUsersTransactionsBeforeAdding).toHaveLength(
        transactionsToAdd.length,
      );
      expect(allOperationsBeforeAdding).toHaveLength(initOperationsLength);

      const transactionData: TransactionCreateDTO = {
        description: 'Test transaction',
        operations: operationsData,
        postingDate: new Date().toString(),
        transactionDate: new Date().toString(),
        userId: user.id,
      };

      // Create a transaction

      const createdTransaction = await testDB.createTestTransaction({
        data: transactionData,
        userId: user.id,
      });

      const transactionId = createdTransaction.id;

      const createdOperations = await testDB.db
        .select()
        .from(operationsTable)
        .where(eq(operationsTable.transactionId, transactionId))
        .all();

      const allUsersTransactionsAfterAdding = await testDB.db
        .select()
        .from(transactionsTable)
        .all();

      const allOperationsAfterAdding = await testDB.db
        .select()
        .from(operationsTable)
        .all();

      expect(createdOperations).toHaveLength(operationsData.length);

      expect(allUsersTransactionsAfterAdding).toHaveLength(
        transactionsToAdd.length + 1,
      );

      expect(allOperationsAfterAdding).toHaveLength(
        initOperationsLength + operationsData.length,
      );

      const transactionOperations = await testDB.db
        .select()
        .from(operationsTable)
        .where(eq(operationsTable.transactionId, transactionId))
        .all();

      expect(createdTransaction).toBeDefined();
      expect(transactionOperations).toHaveLength(operationsData.length);

      // delete the transaction

      await transactionRepository.delete(transactionId);

      const allUsersTransactionsAfterDeleting = await testDB.db
        .select()
        .from(transactionsTable)
        .all();

      const allOperationsAfterDeleting = await testDB.db
        .select()
        .from(operationsTable)
        .all();

      expect(allUsersTransactionsAfterDeleting.length).toBe(
        transactionsToAdd.length,
      );

      expect(allOperationsAfterDeleting.length).toBe(initOperationsLength);

      const deletedTransaction = await testDB.db
        .select()
        .from(transactionsTable)
        .where(eq(transactionsTable.id, transactionId))
        .get();

      const deletedOperations = await testDB.db
        .select()
        .from(operationsTable)
        .where(eq(operationsTable.transactionId, transactionId))
        .all();

      expect(deletedTransaction).toBeUndefined();
      expect(deletedOperations).toHaveLength(0);
    });
  });

  describe('getAllByUserId', () => {
    it('should return all transactions for a specific user', async () => {
      const userId = user.id;

      const transactions = await transactionRepository.getAllByUserId(userId);

      expect(transactions).toHaveLength(userOneTransactionData.length);

      const initedUserTransactions = userOneTransactionData;

      const initedUserTransactionDescriptionsSet = new Set<string>(
        initedUserTransactions.map((tx) => tx.data?.description ?? ''),
      );
      expect(initedUserTransactionDescriptionsSet.size).toBe(
        userOneTransactionData.length,
      );

      transactions.forEach((transaction) => {
        expect(transaction.userId).toBe(userId);
        expect(
          initedUserTransactionDescriptionsSet.has(transaction.description),
        ).toBe(true);
      });
    });
  });

  describe('getAll', () => {
    it('should return all transactions for all users', async () => {
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
  });

  describe('getTransactionById', () => {
    it('should return a transaction by id with operations', async () => {
      const createdTransaction = allTransactions[0];

      const transaction = await transactionRepository.getTransactionById(
        createdTransaction.id,
      );

      const createdOperationsSetById = new Set(
        createdTransaction.operations.map((op) => op.id),
      );

      expect(transaction).toBeDefined();
      expect(transaction?.id).toBe(createdTransaction.id);
      expect(transaction?.description).toBe(createdTransaction.description);
      expect(transaction?.operations).toHaveLength(
        createdTransaction.operations.length,
      );

      transaction?.operations.forEach((op) => {
        expect(createdOperationsSetById.has(op.id)).toBe(true);
      });
    });
  });

  // it.todo('should update a transaction', async () => {
  //   // Test implementation
  // });

  // it.todo('should delete a transaction', async () => {
  //   // Test implementation
  // });

  // it.todo('should find a transaction by id', async () => {
  //   // Test implementation
  // });
});
