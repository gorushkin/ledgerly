import {
  AccountResponse,
  CategoryResponse,
  OperationCreateDTO,
  TransactionCreate,
  UsersResponse,
  UUID,
} from '@ledgerly/shared/types';
import { eq } from 'node_modules/drizzle-orm/sql/expressions/index.cjs';
import { transactions, operations } from 'src/db/schemas';
import { TestDB } from 'src/db/test-db';
import { OperationRepository } from 'src/infrastructure/db/OperationRepository';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';
import { beforeEach, describe, expect, it } from 'vitest';

type TestDBTransactionParams = {
  userId: UUID;
  data?: TransactionCreate;
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
}): TestDBTransactionParams[] => {
  const { testAccount1, testAccount2, testCategory, userId } = params;

  return [
    {
      data: {
        description: 'Test transaction for user2',
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
    },
  ];
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
  });

  describe('Transaction create', () => {
    it('should create a transaction with valid data with operations', async () => {
      const operations = getOperations({
        testAccount1,
        testAccount2,
        testCategory,
        userId: user.id,
      });

      const transactionData: TransactionCreate = {
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
      const transactionData: TransactionCreate = {
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
    let initTransactionsLength = 0;
    let initOperationsLength = 0;

    beforeEach(async () => {
      const user2 = await testDB.createUser({});

      const user1Transactions = getUserTransactionDTO({
        testAccount1,
        testAccount2,
        testCategory,
        userId: user.id,
      });

      const user2Transactions = getUserTransactionDTO({
        testAccount1,
        testAccount2,
        testCategory,
        userId: user2.id,
      });

      const transactionsToAdd = [...user2Transactions, ...user1Transactions];
      initTransactionsLength = transactionsToAdd.length;

      initOperationsLength = transactionsToAdd.reduce(
        (acc, curr) => acc + (curr.operationData?.length ?? 0),
        0,
      );

      const promises = transactionsToAdd.map((params) =>
        testDB.createTestTransaction(params),
      );

      await Promise.all(promises);
    });

    it('should delete a transaction by id with operations', async () => {
      const operationsData = getOperations({
        testAccount1,
        testAccount2,
        testCategory,
        userId: user.id,
      });

      const allUsersTransactionsBeforeAdding = await testDB.db
        .select()
        .from(transactions)
        .all();

      const allOperationsBeforeAdding = await testDB.db
        .select()
        .from(operations)
        .all();

      expect(allUsersTransactionsBeforeAdding).toHaveLength(2);
      expect(allOperationsBeforeAdding).toHaveLength(initOperationsLength);

      const transactionData: TransactionCreate = {
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

      const transactionId = createdTransaction.transaction.id;

      const createdOperations = await testDB.db
        .select()
        .from(operations)
        .where(eq(operations.transactionId, transactionId))
        .all();

      const allUsersTransactionsAfterAdding = await testDB.db
        .select()
        .from(transactions)
        .all();

      const allOperationsAfterAdding = await testDB.db
        .select()
        .from(operations)
        .all();

      expect(createdOperations).toHaveLength(operationsData.length);

      expect(allUsersTransactionsAfterAdding).toHaveLength(
        initTransactionsLength + 1,
      );

      expect(allOperationsAfterAdding).toHaveLength(
        initOperationsLength + operationsData.length,
      );

      const transactionOperations = await testDB.db
        .select()
        .from(operations)
        .where(eq(operations.transactionId, transactionId))
        .all();

      expect(createdTransaction).toBeDefined();
      expect(transactionOperations).toHaveLength(operationsData.length);

      // delete the transaction

      await transactionRepository.delete(transactionId);

      const allUsersTransactionsAfterDeleting = await testDB.db
        .select()
        .from(transactions)
        .all();

      const allOperationsAfterDeleting = await testDB.db
        .select()
        .from(operations)
        .all();

      expect(allUsersTransactionsAfterDeleting.length).toBe(
        initTransactionsLength,
      );

      expect(allOperationsAfterDeleting.length).toBe(initOperationsLength);

      const deletedTransaction = await testDB.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, transactionId))
        .get();

      const deletedOperations = await testDB.db
        .select()
        .from(operations)
        .where(eq(operations.transactionId, transactionId))
        .all();

      expect(deletedTransaction).toBeUndefined();
      expect(deletedOperations).toHaveLength(0);
    });
  });

  it.todo('should create a transaction', async () => {
    // Test implementation
  });

  it.todo('should update a transaction', async () => {
    // Test implementation
  });

  it.todo('should delete a transaction', async () => {
    // Test implementation
  });

  it.todo('should find a transaction by id', async () => {
    // Test implementation
  });
});
