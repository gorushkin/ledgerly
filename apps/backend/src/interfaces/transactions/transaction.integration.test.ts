import { ROUTES } from '@ledgerly/shared/routes';
import { MoneyString, UUID } from '@ledgerly/shared/types';
import {
  OperationCreateInput,
  TransactionCreateInput,
} from '@ledgerly/shared/validation';
import {
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application';
import {
  AccountDbRow,
  OperationDbRow,
  TransactionDbRow,
  UserDbRow,
} from 'src/db/schema';
import { CreateTransactionProps, TestDB } from 'src/db/test-db';
import { compareEntities } from 'src/db/test-utils';
import { compareCommonEntities } from 'src/db/test-utils/entityComparer';
import { Amount, Currency, DateValue, Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'Password123!',
};

const url = `/api${ROUTES.transactions}`;

describe('Transactions Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: UUID;
  let user: UserDbRow;

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

    await server.ready();

    user = await testDB.createUser(testUser);

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = Id.fromPersistence(decoded.userId).valueOf();
  });

  afterEach(async () => {
    await testDB.cleanupTestDb();
  });

  describe('POST /api/transactions', () => {
    let account1: AccountDbRow;
    let account2: AccountDbRow;
    let operation1: OperationCreateInput;
    let operation2: OperationCreateInput;

    beforeEach(async () => {
      account1 = await testDB.createAccount(userId, {
        name: 'Checking',
      });

      account2 = await testDB.createAccount(userId, {
        name: 'Savings',
      });

      operation1 = {
        accountId: account1.id,
        amount: Amount.create('-100').valueOf(),
        description: 'Transfer from checking',
        value: Amount.create('-100').valueOf(),
      };

      operation2 = {
        accountId: account2.id,
        amount: Amount.create('100').valueOf(),
        description: 'Transfer to savings',
        value: Amount.create('100').valueOf(),
      };
    });

    it('should create a new transaction', async () => {
      const payload: TransactionCreateInput = {
        currencyCode: Currency.create('USD').valueOf(),
        description: 'some transaction',
        operations: [operation1, operation2],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      const transaction = JSON.parse(response.body) as TransactionResponseDTO;

      expect(response.statusCode).toBe(201);

      expect(transaction.description).toBe(payload.description);
      expect(transaction.postingDate).toBe(payload.postingDate);
      expect(transaction.transactionDate).toBe(payload.transactionDate);
      expect(transaction.userId).toBe(userId);
      expect(transaction.operations.length).toBe(payload.operations.length);

      transaction.operations.forEach((operation, index) => {
        expect(operation.accountId).toBe(payload.operations[index].accountId);
        expect(operation.amount).toBe(payload.operations[index].amount);
        expect(operation.description).toBe(
          payload.operations[index].description,
        );
        expect(operation.value).toBe(payload.operations[index].value);
      });
    });

    it('should fail when required fields are missing', async () => {
      const payload = {
        description: 'incomplete transaction',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with invalid amounts', async () => {
      const payload: TransactionCreateInput = {
        currencyCode: Currency.create('USD').valueOf(),
        description: 'invalid amount',
        operations: [
          operation1,
          {
            accountId: account2.id,
            amount: 'invalid' as unknown as MoneyString,
            description: 'Transfer to savings',
            value: 'invalid' as unknown as MoneyString,
          },
        ],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail for unauthorized access', async () => {
      const payload: TransactionCreateInput = {
        currencyCode: Currency.create('USD').valueOf(),
        description: 'unauthorized access',
        operations: [operation1, operation2],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail for non-existent accounts', async () => {
      const payload: TransactionCreateInput = {
        currencyCode: Currency.create('USD').valueOf(),
        description: 'non-existent account',
        operations: [
          { ...operation1, accountId: Id.create().valueOf() },
          { ...operation2, accountId: Id.create().valueOf() },
        ],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should fail when operations do not sum to zero (unbalanced transaction)', async () => {
      const payload: TransactionCreateInput = {
        currencyCode: Currency.create('USD').valueOf(),
        description: 'unbalanced transaction',
        operations: [
          operation1,
          {
            ...operation2,
            value: Amount.create('50').valueOf(),
          },
        ],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail when using an account that belongs to another user', async () => {
      // Create a second user and an account for that user
      const otherUser = await testDB.createUser({
        email: 'otheruser@example.com',
        password: 'password123',
      });

      const otherUserAccount = await testDB.createAccount(otherUser.id, {
        currency: Currency.create('USD').valueOf(),
        name: 'Other User Account',
      });

      const payload: TransactionCreateInput = {
        currencyCode: Currency.create('USD').valueOf(),
        description: 'unauthorized access',
        operations: [
          { ...operation1, accountId: otherUserAccount.id },
          { ...operation2, accountId: otherUserAccount.id },
        ],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('GET /api/transactions/:id', () => {
    let transaction: TransactionDbRow;
    let operations: OperationDbRow[];

    const operationsMap = new Map<UUID, OperationDbRow>();

    beforeEach(async () => {
      const accounts = await Promise.all([
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          name: 'Checking USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          name: 'Savings USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('EUR').valueOf(),
          name: 'Savings EUR',
        }),
      ]);

      transaction = await testDB.createTransaction(userId);

      const transaction1Operations = [
        {
          accountId: accounts[0].id,
          amount: Amount.create('-100').valueOf(),
          description: 'Transfer from checking',
          transactionId: transaction.id,
          value: Amount.create('-100').valueOf(),
        },
        {
          accountId: accounts[1].id,
          amount: Amount.create('100').valueOf(),
          description: 'Transfer to savings',
          transactionId: transaction.id,
          value: Amount.create('100').valueOf(),
        },
      ];

      operations = await Promise.all(
        transaction1Operations.map(async (op) => {
          const operation = await testDB.createOperation(userId, {
            accountId: op.accountId,
            amount: op.amount,
            description: op.description,
            transactionId: op.transactionId,
            value: op.value,
          });
          operationsMap.set(operation.id, operation);

          return operation;
        }),
      );
    });

    it('should retrieve a transaction by ID', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${transaction.id}`,
      });

      const transactionResponse = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(transactionResponse.id).toBe(transaction.id);
      expect(transactionResponse.userId).toBe(userId);

      expect(transactionResponse.operations).toHaveLength(operations.length);

      transactionResponse.operations.forEach((op) => {
        const matchedOp = operationsMap.get(op.id)!;
        compareEntities(matchedOp, op as typeof matchedOp, ['isTombstone']);
      });
    });

    it.todo('should return 404 for a non-existent transaction ID');
    it.todo('should return 404 when transaction is soft-deleted (tombstone)');
    it.todo("should return 404 when accessing another user's transaction");
    it.todo('should return 401 when not authorized');
  });

  describe('GET /api/transactions', () => {
    it('should retrieve all transactions for the user', async () => {
      const accounts = await Promise.all([
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          name: 'Checking USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          name: 'Savings USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('EUR').valueOf(),
          name: 'Savings EUR',
        }),
      ]);

      const transaction1Params: CreateTransactionProps = {
        currencyCode: accounts[0].currency,
        description: 'transaction one',
        isTombstone: false,
        postingDate: DateValue.create().valueOf(),
        transactionDate: DateValue.create().valueOf(),
      };

      const transaction2Params: CreateTransactionProps = {
        currencyCode: accounts[1].currency,
        description: 'transaction two',
        isTombstone: false,
        postingDate: DateValue.create().valueOf(),
        transactionDate: DateValue.create().valueOf(),
      };

      const transactionData = [transaction1Params, transaction2Params];

      await Promise.all(
        transactionData.map((tr) => {
          return testDB.createTransaction(userId, tr);
        }),
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const transactions = JSON.parse(
        response.body,
      ) as TransactionResponseDTO[];

      const userTransactions = transactions.filter(
        (tx) => tx.userId === userId,
      );

      expect(userTransactions).toHaveLength(transactionData.length);
    });

    it.todo('should return 401 when not authorized');
    it.todo('should return empty array when user has no transactions');
    it.todo('should not return soft-deleted (tombstone) transactions');
    it.todo('should return transactions filtered by accountId query param');
    it.todo('should return 400 for invalid accountId query param (non-UUID)');
  });

  describe('DELETE /api/transactions/:id', () => {
    it('should delete an existing transaction and return 204', async () => {
      const transaction = await testDB.createTransaction(userId);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(204);

      const dbRecord = await testDB.getTransactionById(transaction.id);

      expect(dbRecord).toBeDefined();
      expect(dbRecord!.isTombstone).toBe(true);
    });

    it('should return 404 when deleting a non-existent transaction', async () => {
      const nonExistentId = Id.create().valueOf();
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url: `${url}/${nonExistentId}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when deleting an already deleted transaction', async () => {
      const transaction = await testDB.createTransaction(userId);

      await testDB.softDeleteTransaction(transaction.id);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when deleting without authorization', async () => {
      const transaction = await testDB.createTransaction(userId);

      const response = await server.inject({
        method: 'DELETE',
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should not return deleted transaction in GET /api/transactions', async () => {
      const transaction = await testDB.createTransaction(userId);

      await testDB.softDeleteTransaction(transaction.id);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const transactions = JSON.parse(
        response.body,
      ) as TransactionResponseDTO[];

      const deletedTransaction = transactions.find(
        (tx) => tx.id === transaction.id,
      );

      expect(deletedTransaction).toBeUndefined();
    });

    it("should return 404 when deleting another user's transaction", async () => {
      const otherUser = await testDB.createUser({
        email: 'otheruser@example.com',
        password: 'password123',
      });

      const otherUserTransaction = await testDB.createTransaction(otherUser.id);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url: `${url}/${otherUserTransaction.id}`,
      });

      expect(response.statusCode).toBe(404);
    });
  });

  describe('PUT /api/transactions/:id', () => {
    let account1Data: AccountDbRow;
    let account2Data: AccountDbRow;
    let operation1Data: OperationCreateInput;
    let operation2Data: OperationCreateInput;

    beforeEach(async () => {
      account1Data = await testDB.createAccount(userId, {
        name: 'Checking',
      });

      account2Data = await testDB.createAccount(userId, {
        name: 'Savings',
      });

      operation1Data = {
        accountId: account1Data.id,
        amount: Amount.create('-100').valueOf(),
        description: 'Transfer from checking',
        value: Amount.create('-100').valueOf(),
      };

      operation2Data = {
        accountId: account2Data.id,
        amount: Amount.create('100').valueOf(),
        description: 'Transfer to savings',
        value: Amount.create('100').valueOf(),
      };
    });

    it('should update transaction metadata (description, dates) and return 200', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      await testDB.createOperation(userId, {
        ...operation1Data,
        transactionId: transaction.id,
      });

      await testDB.createOperation(userId, {
        ...operation2Data,
        transactionId: transaction.id,
      });

      const transactionWithOperations =
        await testDB.getTransactionWithRelations(transaction.id);

      if (!transactionWithOperations) {
        throw new Error('Failed to fetch transaction with operations');
      }

      const operations = transactionWithOperations.operations;

      const updatedData: UpdateTransactionRequestDTO = {
        description: 'Updated description',
        operations: {
          create: [],
          delete: [],
          update: [],
        },
        postingDate: DateValue.create().valueOf(),
        transactionDate: DateValue.create().valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(200);

      const updatedTransaction = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      expect(updatedTransaction.description).toBe(updatedData.description);
      expect(updatedTransaction.postingDate).toBe(updatedData.postingDate);
      expect(updatedTransaction.transactionDate).toBe(
        updatedData.transactionDate,
      );

      updatedTransaction.operations.forEach((op) => {
        const originalOp = operations.find((o) => o.id === op.id);

        if (!originalOp) {
          throw new Error(
            `Operation with ID ${op.id} not found in original operations`,
          );
        }

        compareCommonEntities(originalOp, op);
      });
    });

    it('should update transaction by adding new operations and return 200', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      const createdOperations = await Promise.all([
        testDB.createOperation(userId, {
          ...operation1Data,
          transactionId: transaction.id,
        }),
        testDB.createOperation(userId, {
          ...operation2Data,
          transactionId: transaction.id,
        }),
      ]);

      const newOperationData1: OperationCreateInput = {
        accountId: account1Data.id,
        amount: Amount.create('50').valueOf(),
        description: 'New operation',
        value: Amount.create('50').valueOf(),
      };

      const newOperationData2: OperationCreateInput = {
        accountId: account2Data.id,
        amount: Amount.create('-50').valueOf(),
        description: 'New operation',
        value: Amount.create('-50').valueOf(),
      };

      const operationsToCreate = [newOperationData1, newOperationData2];

      const updatedData: UpdateTransactionRequestDTO = {
        description: transaction.description,
        operations: {
          create: operationsToCreate,
          delete: [],
          update: [],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(200);

      const updatedTransaction = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      const operationsCount =
        createdOperations.length + operationsToCreate.length;

      expect(updatedTransaction.operations).toHaveLength(operationsCount);

      const comparedOperationsSet = new Set<UUID>();

      updatedTransaction.operations.forEach((op) => {
        const createdOp = createdOperations.find((o) => o.id === op.id);

        if (createdOp) {
          compareCommonEntities(createdOp, op);
          comparedOperationsSet.add(op.id);
          return;
        }

        const newOp = operationsToCreate.find(
          (o) => o.accountId === op.accountId && o.amount === op.amount,
        );

        if (newOp) {
          compareCommonEntities(newOp, op);
          comparedOperationsSet.add(op.id);
        }
      });

      expect(comparedOperationsSet.size).toBe(operationsCount);
    });

    it('should update transaction by deleting operations and return 200', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      const createdOperations = await Promise.all([
        testDB.createOperation(userId, {
          ...operation1Data,
          transactionId: transaction.id,
        }),
        testDB.createOperation(userId, {
          ...operation2Data,
          transactionId: transaction.id,
        }),
        testDB.createOperation(userId, {
          ...operation1Data,
          transactionId: transaction.id,
        }),
        testDB.createOperation(userId, {
          ...operation2Data,
          transactionId: transaction.id,
        }),
      ]);

      const operationsToDelete = createdOperations.slice(0, 2);

      const updatedData: UpdateTransactionRequestDTO = {
        description: transaction.description,
        operations: {
          create: [],
          delete: operationsToDelete.map((op) => op.id),
          update: [],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(200);

      const updatedTransaction = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      const expectedOperationsCount =
        createdOperations.length - operationsToDelete.length;

      expect(updatedTransaction.operations).toHaveLength(
        expectedOperationsCount,
      );

      const deletedOperationIds = new Set(
        operationsToDelete.map((op) => op.id),
      );

      updatedTransaction.operations.forEach((op) => {
        if (deletedOperationIds.has(op.id)) {
          throw new Error(`Operation with ID ${op.id} was not deleted`);
        }

        const originalOp = createdOperations.find((o) => o.id === op.id);

        if (!originalOp) {
          throw new Error(
            `Operation with ID ${op.id} not found in original operations`,
          );
        }

        compareCommonEntities(originalOp, op);
      });
    });
    it.todo('should return 404 when updating a non-existent transaction');
    it.todo('should return 404 when updating a soft-deleted transaction');
    it.todo("should return 404 when updating another user's transaction");
    it.todo('should return 400 for invalid payload (missing required fields)');
    it.todo('should return 401 when not authorized');
    it.todo('should return 409 on optimistic locking conflict (stale version)');

    it('should return 400 when resulting operations are unbalanced (sum != 0)', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      await testDB.createOperation(userId, {
        ...operation1Data,
        transactionId: transaction.id,
      });

      await testDB.createOperation(userId, {
        ...operation2Data,
        transactionId: transaction.id,
      });

      const updatedData: UpdateTransactionRequestDTO = {
        description: transaction.description,
        operations: {
          create: [],
          delete: [],
          update: [
            {
              accountId: operation1Data.accountId,
              amount: Amount.create('-150').valueOf(),
              description: operation1Data.description,
              id: operation1Data.accountId,
              value: Amount.create('-150').valueOf(),
            },
          ],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(400);
    });
  });
});
