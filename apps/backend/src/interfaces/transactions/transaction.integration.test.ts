import { ROUTES } from '@ledgerly/shared/routes';
import { MoneyString, UUID } from '@ledgerly/shared/types';
import {
  OperationCreateInput,
  TransactionCreateInput,
} from '@ledgerly/shared/validation';
import { TransactionResponseDTO } from 'src/application';
import {
  AccountDbRow,
  OperationDbRow,
  TransactionDbRow,
  UserDbRow,
} from 'src/db/schema';
import { CreateTransactionProps, TestDB } from 'src/db/test-db';
import { compareEntities } from 'src/db/test-utils';
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
    it.todo('should delete an existing transaction and return 204');
    it.todo('should return 404 when deleting a non-existent transaction');
    it.todo('should return 404 when deleting an already deleted transaction');
    it.todo('should return 401 when deleting without authorization');
    it.todo('should not return deleted transaction in GET /api/transactions');
    it.todo("should return 404 when deleting another user's transaction");
  });

  describe('PUT /api/transactions/:id', () => {
    it.todo(
      'should update transaction metadata (description, dates) and return 200',
    );
    it.todo(
      'should update transaction by adding new operations and return 200',
    );
    it.todo('should update transaction by deleting operations and return 200');
    it.todo('should return 404 when updating a non-existent transaction');
    it.todo('should return 404 when updating a soft-deleted transaction');
    it.todo("should return 404 when updating another user's transaction");
    it.todo('should return 400 for invalid payload (missing required fields)');
    it.todo('should return 401 when not authorized');
    it.todo('should return 409 on optimistic locking conflict (stale version)');
    it.todo(
      'should return 400 when resulting operations are unbalanced (sum != 0)',
    );
  });
});
