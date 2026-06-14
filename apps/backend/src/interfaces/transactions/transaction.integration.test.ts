import { ROUTES } from '@ledgerly/shared/routes';
import { MoneyString, UUID } from '@ledgerly/shared/types';
import {
  OperationCreateInput,
  TransactionCreateInput,
} from '@ledgerly/shared/validation';
import {
  TransactionListResponseDTO,
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

const parseResponse = <T>(response: { body: string }): T => {
  return JSON.parse(response.body) as T;
};

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

  const createAccounts = async () => {
    return Promise.all([
      testDB.createAccount(userId, {
        currency: Currency.create('USD').valueOf(),
        name: 'Checking USD',
      }),
      testDB.createAccount(userId, {
        currency: Currency.create('USD').valueOf(),
        name: 'Savings USD',
      }),
    ]);
  };

  describe('POST /api/transactions', () => {
    let account1: AccountDbRow;
    let account2: AccountDbRow;
    let operation1: OperationCreateInput;
    let operation2: OperationCreateInput;

    beforeEach(async () => {
      [account1, account2] = await createAccounts();

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

      const transaction = parseResponse<TransactionResponseDTO>(response);

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
      const accounts = await createAccounts();

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

    it('should return 404 for a non-existent transaction ID', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${Id.create().valueOf()}`,
      });

      const body = JSON.parse(response.body) as {
        error: boolean;
        message: string;
      };

      expect(response.statusCode).toBe(404);
      expect(body).toEqual({
        error: true,
        message: 'Transaction not found',
      });
    });

    it('should return 404 when transaction is soft-deleted (tombstone)', async () => {
      await testDB.softDeleteTransaction(transaction.id);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should not return soft-deleted (tombstone) operations', async () => {
      const createdTransaction = await testDB.createTransaction(userId);

      const deletedOperationsData = [
        {
          accountId: operations[0].accountId,
          amount: Amount.create('-50').valueOf(),
          description: 'Deleted operation',
          id: Id.create().valueOf(),
          isTombstone: true,
          transactionId: createdTransaction.id,
          value: Amount.create('-50').valueOf(),
        },
        {
          accountId: operations[1].accountId,
          amount: Amount.create('50').valueOf(),
          description: 'Deleted operation',
          id: Id.create().valueOf(),
          isTombstone: true,
          transactionId: createdTransaction.id,
          value: Amount.create('50').valueOf(),
        },
      ];

      const activeOperations = [
        {
          accountId: operations[0].accountId,
          amount: Amount.create('-50').valueOf(),
          description: 'Active operation',
          id: Id.create().valueOf(),
          transactionId: createdTransaction.id,
          value: Amount.create('-50').valueOf(),
        },
        {
          accountId: operations[1].accountId,
          amount: Amount.create('50').valueOf(),
          description: 'Active operation',
          id: Id.create().valueOf(),
          transactionId: createdTransaction.id,
          value: Amount.create('50').valueOf(),
        },
      ];

      const operationsData = [...deletedOperationsData, ...activeOperations];

      await Promise.all(
        operationsData.map((op) => testDB.createOperation(userId, op)),
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${createdTransaction.id}`,
      });

      const transactionResponse = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      expect(response.statusCode).toBe(200);

      expect(transactionResponse.operations).toHaveLength(
        activeOperations.length,
      );

      deletedOperationsData.forEach((deletedOp) => {
        expect(
          transactionResponse.operations.some((op) => op.id === deletedOp.id),
        ).toBe(false);
      });

      transactionResponse.operations.forEach((op) => {
        const isDeleted = deletedOperationsData.some(
          (deletedOp) => deletedOp.id === op.id,
        );

        expect(isDeleted).toBe(false);

        const matchedOp = activeOperations.find((o) => o.id === op.id);

        if (!matchedOp) {
          throw new Error(
            `Operation with ID ${op.id} not found in active operations`,
          );
        }

        compareCommonEntities(matchedOp, op as typeof matchedOp);
      });
    });

    it("should return 404 when accessing another user's transaction", async () => {
      const otherUser = await testDB.createUser();

      const otherUserTransaction = await testDB.createTransaction(otherUser.id);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${otherUserTransaction.id}`,
      });

      expect(response.statusCode).toBe(404);
    });

    it('should return 401 when not authorized', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `${url}/some-transaction-id`,
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('GET /api/transactions', () => {
    let accounts: AccountDbRow[];

    beforeEach(async () => {
      accounts = await createAccounts();
    });

    it('should retrieve all transactions for the user', async () => {
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

      const { items: transactions, pagination } =
        parseResponse<TransactionListResponseDTO>(response);

      const userTransactions = transactions.filter(
        (tx) => tx.userId === userId,
      );

      expect(userTransactions).toHaveLength(transactionData.length);
      expect(pagination).toMatchObject({
        page: 1,
        pageSize: 20,
        total: transactionData.length,
        totalPages: 1,
      });
    });

    it('should return 401 when not authorized', async () => {
      const response = await server.inject({
        method: 'GET',
        url: `${url}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return empty array when user has no transactions', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const { items: transactions, pagination } =
        parseResponse<TransactionListResponseDTO>(response);

      expect(transactions).toHaveLength(0);
      expect(pagination.total).toBe(0);
      expect(pagination.totalPages).toBe(0);
    });

    it('should not return soft-deleted (tombstone) transactions', async () => {
      const transactionToBeDeleted = await testDB.createTransaction(userId);

      const otherTransaction = await testDB.createTransaction(userId);

      await testDB.softDeleteTransaction(transactionToBeDeleted.id);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const { items: transactions } =
        parseResponse<TransactionListResponseDTO>(response);

      const deletedTransaction = transactions.find(
        (tx) => tx.id === transactionToBeDeleted.id,
      );

      expect(deletedTransaction).toBeUndefined();

      const otherTransactionExists = transactions.find(
        (tx) => tx.id === otherTransaction.id,
      );

      expect(otherTransactionExists).toBeDefined();
    });

    it('should not return soft-deleted (tombstone) operations in transactions', async () => {
      const createdTransaction = await testDB.createTransaction(userId);

      const deletedOperationsData = [
        {
          accountId: accounts[0].id,
          amount: Amount.create('-50').valueOf(),
          description: 'Deleted operation',
          id: Id.create().valueOf(),
          isTombstone: true,
          transactionId: createdTransaction.id,
          value: Amount.create('-50').valueOf(),
        },
        {
          accountId: accounts[1].id,
          amount: Amount.create('50').valueOf(),
          description: 'Deleted operation',
          id: Id.create().valueOf(),
          isTombstone: true,
          transactionId: createdTransaction.id,
          value: Amount.create('50').valueOf(),
        },
      ];

      const activeOperations = [
        {
          accountId: accounts[0].id,
          amount: Amount.create('-50').valueOf(),
          description: 'Active operation',
          id: Id.create().valueOf(),
          transactionId: createdTransaction.id,
          value: Amount.create('-50').valueOf(),
        },
        {
          accountId: accounts[1].id,
          amount: Amount.create('50').valueOf(),
          description: 'Active operation',
          id: Id.create().valueOf(),
          transactionId: createdTransaction.id,
          value: Amount.create('50').valueOf(),
        },
      ];

      const operationsData = [...deletedOperationsData, ...activeOperations];

      await Promise.all(
        operationsData.map((op) => testDB.createOperation(userId, op)),
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const { items: transactions } =
        parseResponse<TransactionListResponseDTO>(response);

      const transactionResponse = transactions.find(
        (tx) => tx.id === createdTransaction.id,
      );

      expect(transactionResponse).toBeDefined();

      expect(transactionResponse?.operations).toHaveLength(
        activeOperations.length,
      );

      transactionResponse!.operations.forEach((op) => {
        const isDeleted = deletedOperationsData.some(
          (deletedOp) => deletedOp.id === op.id,
        );

        expect(isDeleted).toBe(false);

        const matchedOp = activeOperations.find((o) => o.id === op.id);

        if (!matchedOp) {
          throw new Error(
            `Operation with ID ${op.id} not found in active operations`,
          );
        }

        compareCommonEntities(matchedOp, op as typeof matchedOp);
      });

      activeOperations.forEach((activeOperation) => {
        expect(
          transactionResponse?.operations.some(
            (operation) => operation.id === activeOperation.id,
          ),
        ).toBe(true);
      });
    });

    it('should return transactions filtered by accountId with all active operations', async () => {
      const matchingTransaction = await testDB.createTransaction(userId);
      const otherTransaction = await testDB.createTransaction(userId);

      const matchingOperations = [
        {
          accountId: accounts[0].id,
          amount: Amount.create('-100').valueOf(),
          description: 'Matching account operation',
          id: Id.create().valueOf(),
          transactionId: matchingTransaction.id,
          value: Amount.create('-100').valueOf(),
        },
        {
          accountId: accounts[1].id,
          amount: Amount.create('100').valueOf(),
          description: 'Balancing operation',
          id: Id.create().valueOf(),
          transactionId: matchingTransaction.id,
          value: Amount.create('100').valueOf(),
        },
      ];

      await Promise.all([
        ...matchingOperations.map((operation) =>
          testDB.createOperation(userId, operation),
        ),
        testDB.createOperation(userId, {
          accountId: accounts[1].id,
          amount: Amount.create('50').valueOf(),
          description: 'Other transaction operation',
          id: Id.create().valueOf(),
          transactionId: otherTransaction.id,
          value: Amount.create('50').valueOf(),
        }),
      ]);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?accountId=${accounts[0].id}`,
      });

      expect(response.statusCode).toBe(200);

      const result = parseResponse<TransactionListResponseDTO>(response);

      expect(result.pagination.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(matchingTransaction.id);
      expect(result.items[0].operations).toHaveLength(
        matchingOperations.length,
      );
      expect(
        result.items[0].operations.map((operation) => operation.id),
      ).toEqual(
        expect.arrayContaining(
          matchingOperations.map((operation) => operation.id),
        ),
      );
    });

    it('should filter by an inclusive transaction date range', async () => {
      const transactionDates = [
        ['Before range', '2024-01-01'],
        ['Range start', '2024-01-02'],
        ['Range end', '2024-01-03'],
      ] as const;

      await Promise.all(
        transactionDates.map(([description, transactionDate]) =>
          testDB.createTransaction(userId, {
            description,
            transactionDate: DateValue.restore(transactionDate).valueOf(),
          }),
        ),
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?dateFrom=2024-01-02&dateTo=2024-01-03`,
      });

      expect(response.statusCode).toBe(200);

      const result = parseResponse<TransactionListResponseDTO>(response);

      expect(result.pagination.total).toBe(2);
      expect(
        result.items.map((transaction) => transaction.description),
      ).toEqual(['Range end', 'Range start']);
    });

    it('should sort and paginate transactions', async () => {
      const transactionDates = [
        ['First', '2024-01-01'],
        ['Second', '2024-01-02'],
        ['Third', '2024-01-03'],
      ] as const;

      await Promise.all(
        transactionDates.map(([description, transactionDate]) =>
          testDB.createTransaction(userId, {
            description,
            transactionDate: DateValue.restore(transactionDate).valueOf(),
          }),
        ),
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?page=2&pageSize=1&sortBy=transactionDate&sortOrder=asc`,
      });

      expect(response.statusCode).toBe(200);

      const result = parseResponse<TransactionListResponseDTO>(response);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].description).toBe('Second');
      expect(result.pagination).toEqual({
        hasNextPage: true,
        hasPreviousPage: true,
        page: 2,
        pageSize: 1,
        total: 3,
        totalPages: 3,
      });
    });

    it.each([
      ['invalid accountId', 'accountId=not-a-uuid'],
      ['reversed date range', 'dateFrom=2024-01-03&dateTo=2024-01-02'],
      ['page size above maximum', 'pageSize=101'],
    ])('should return 400 for %s', async (_, query) => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?${query}`,
      });

      expect(response.statusCode).toBe(400);
    });
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

      const { items: transactions } =
        parseResponse<TransactionListResponseDTO>(response);

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

    const createUpdateRequest = (
      overrides: Partial<UpdateTransactionRequestDTO> = {},
    ): UpdateTransactionRequestDTO => ({
      description: 'Updated description',
      operations: {
        create: [],
        delete: [],
        update: [],
      },
      postingDate: DateValue.create().valueOf(),
      transactionDate: DateValue.create().valueOf(),
      version: 0,
      ...overrides,
    });

    const sendUpdateRequest = (
      transactionId: UUID,
      payload: UpdateTransactionRequestDTO,
    ) =>
      server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload,
        url: `${url}/${transactionId}`,
      });

    beforeEach(async () => {
      [account1Data, account2Data] = await createAccounts();

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

    it('should update metadata without changing operations', async () => {
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

      const updatedData = createUpdateRequest({
        description: 'Updated description',
      });

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(200);

      const updatedTransaction =
        parseResponse<TransactionResponseDTO>(response);

      expect(updatedTransaction.description).toBe(updatedData.description);
      expect(updatedTransaction.version).toBe(updatedData.version + 1);
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

    it('should create operations without changing existing operations', async () => {
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

      const updatedData = createUpdateRequest({
        description: transaction.description,
        operations: {
          create: operationsToCreate,
          delete: [],
          update: [],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      });

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(200);

      const updatedTransaction =
        parseResponse<TransactionResponseDTO>(response);

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

    it('should update existing operations and persist their changes', async () => {
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

      const operationsToUpdate = [
        {
          accountId: account1Data.id,
          amount: Amount.create('-150').valueOf(),
          description: 'Updated transfer from checking',
          id: createdOperations[0].id,
          value: Amount.create('-150').valueOf(),
        },
        {
          accountId: account2Data.id,
          amount: Amount.create('150').valueOf(),
          description: 'Updated transfer to savings',
          id: createdOperations[1].id,
          value: Amount.create('150').valueOf(),
        },
      ];

      const updatedData = createUpdateRequest({
        description: transaction.description,
        operations: {
          create: [],
          delete: [],
          update: operationsToUpdate,
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      });

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(200);

      const updatedTransaction =
        parseResponse<TransactionResponseDTO>(response);

      const persistedTransaction = await testDB.getTransactionWithRelations(
        transaction.id,
      );

      expect(updatedTransaction.operations).toHaveLength(
        operationsToUpdate.length,
      );

      expect(persistedTransaction).not.toBeNull();

      operationsToUpdate.forEach((operation) => {
        const responseOperation = updatedTransaction.operations.find(
          ({ id }) => id === operation.id,
        );
        const persistedOperation = persistedTransaction?.operations.find(
          ({ id }) => id === operation.id,
        );

        expect(responseOperation).toBeDefined();
        expect(persistedOperation).toBeDefined();
        compareCommonEntities(operation, responseOperation!);
        compareCommonEntities(operation, persistedOperation!);
      });
    });

    it('should apply create, update, and delete operations in one request', async () => {
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

      const initialTransaction = await testDB.getTransactionWithRelations(
        transaction.id,
      );

      if (!initialTransaction) {
        throw new Error('Failed to fetch initial transaction state');
      }

      const operationToUpdate = {
        accountId: account1Data.id,
        amount: Amount.create('-80').valueOf(),
        description: 'Updated existing operation',
        id: createdOperations[0].id,
        value: Amount.create('-80').valueOf(),
      };

      const operationIdToDelete = createdOperations[1].id;

      const operationToCreate: OperationCreateInput = {
        accountId: account2Data.id,
        amount: Amount.create('80').valueOf(),
        description: 'Replacement operation',
        value: Amount.create('80').valueOf(),
      };

      const updatedData = createUpdateRequest({
        description: 'Mixed patch transaction',
        operations: {
          create: [operationToCreate],
          delete: [operationIdToDelete],
          update: [operationToUpdate],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      });

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(200);

      const updatedTransaction =
        parseResponse<TransactionResponseDTO>(response);

      const persistedTransaction = await testDB.getTransactionWithRelations(
        transaction.id,
      );

      const updatedOperation = updatedTransaction.operations.find(
        ({ id }) => id === operationToUpdate.id,
      );

      const createdOperation = updatedTransaction.operations.find(
        ({ accountId, amount, description, value }) =>
          accountId === operationToCreate.accountId &&
          amount === operationToCreate.amount &&
          description === operationToCreate.description &&
          value === operationToCreate.value,
      );

      const deletedOperationInResponse = updatedTransaction.operations.find(
        ({ id }) => id === operationIdToDelete,
      );

      const deletedOperation = persistedTransaction?.operations.find(
        ({ id }) => id === operationIdToDelete,
      );

      expect(updatedTransaction.description).toBe(updatedData.description);
      expect(updatedTransaction.operations).toHaveLength(
        initialTransaction.operations.length,
      );
      expect(updatedOperation).toBeDefined();
      expect(createdOperation).toBeDefined();
      expect(deletedOperationInResponse).toBeUndefined();

      expect(deletedOperation?.isTombstone).toBe(true);
      compareCommonEntities(operationToUpdate, updatedOperation!);
      compareCommonEntities(operationToCreate, createdOperation!);

      expect(persistedTransaction?.operations).toContainEqual(
        expect.objectContaining({
          ...operationToUpdate,
          isTombstone: false,
        }),
      );

      expect(persistedTransaction?.operations).toContainEqual(
        expect.objectContaining({
          ...operationToCreate,
          id: createdOperation?.id,
          isTombstone: false,
        }),
      );
    });

    it('should delete operations from the active response', async () => {
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

      const updatedData = createUpdateRequest({
        description: transaction.description,
        operations: {
          create: [],
          delete: operationsToDelete.map((op) => op.id),
          update: [],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      });

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(200);

      const updatedTransaction =
        parseResponse<TransactionResponseDTO>(response);

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

    it('should return 404 when updating a non-existent transaction', async () => {
      const nonExistentId = Id.create().valueOf();

      const updatedData = createUpdateRequest();

      const response = await sendUpdateRequest(nonExistentId, updatedData);

      expect(response.statusCode).toBe(404);
    });

    it('should return 404 when updating a soft-deleted transaction', async () => {
      const transaction = await testDB.createTransaction(userId);

      await testDB.softDeleteTransaction(transaction.id);

      const updatedData = createUpdateRequest();

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(404);
    });

    it("should return 404 when updating another user's transaction", async () => {
      const another = await testDB.createUser();
      const transaction = await testDB.createTransaction(another.id);

      const updatedData = createUpdateRequest();

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(404);
    });

    it('should return 400 for invalid payload (missing required fields)', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      const invalidPayload = {
        description: 'Updated description',
        operations: {
          create: [],
          delete: [],
          update: [],
        },
        // Missing postingDate and transactionDate
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: invalidPayload,
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 401 when not authorized', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      const updatedData = createUpdateRequest();

      const response = await server.inject({
        method: 'PUT',
        payload: updatedData,
        url: `${url}/${transaction.id}`,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 409 on optimistic locking conflict with a stale version', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      const firstUpdate = createUpdateRequest({
        description: 'First successful update',
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
        version: transaction.version,
      });

      const firstResponse = await sendUpdateRequest(
        transaction.id,
        firstUpdate,
      );

      expect(firstResponse.statusCode).toBe(200);

      const updatedTransaction =
        parseResponse<TransactionResponseDTO>(firstResponse);

      expect(updatedTransaction.description).toBe(firstUpdate.description);
      expect(updatedTransaction.version).toBe(transaction.version + 1);

      const staleUpdate = {
        ...firstUpdate,
        description: 'Stale update must not be persisted',
      };

      const staleResponse = await sendUpdateRequest(
        transaction.id,
        staleUpdate,
      );

      expect(staleResponse.statusCode).toBe(409);

      const errorResponse = parseResponse<{
        code: string;
        error: boolean;
        message: string;
      }>(staleResponse);

      expect(errorResponse.code).toBe('VERSION_CONFLICT');
      expect(errorResponse.error).toBe(true);
      expect(errorResponse.message).toBe(
        `Transaction version mismatch for expected version ${transaction.version}`,
      );

      const persistedTransaction = await testDB.getTransactionById(
        transaction.id,
      );

      expect(persistedTransaction?.description).toBe(firstUpdate.description);
      expect(persistedTransaction?.version).toBe(transaction.version + 1);
    });

    it('should return 400 when resulting operations are unbalanced (sum != 0)', async () => {
      const transaction = await testDB.createTransactionWithOperations(userId);

      const operationToUpdate = await testDB.createOperation(userId, {
        ...operation1Data,
        transactionId: transaction.id,
      });

      await testDB.createOperation(userId, {
        ...operation2Data,
        transactionId: transaction.id,
      });

      const updatedData = createUpdateRequest({
        description: transaction.description,
        operations: {
          create: [],
          delete: [],
          update: [
            {
              accountId: operation1Data.accountId,
              amount: Amount.create('-150').valueOf(),
              description: operation1Data.description,
              id: operationToUpdate.id,
              value: Amount.create('-150').valueOf(),
            },
          ],
        },
        postingDate: transaction.postingDate,
        transactionDate: transaction.transactionDate,
      });

      const response = await sendUpdateRequest(transaction.id, updatedData);

      expect(response.statusCode).toBe(400);
    });
  });
});
