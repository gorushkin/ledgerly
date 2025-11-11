import { ROUTES } from '@ledgerly/shared/routes';
import { UUID } from '@ledgerly/shared/types';
import { TransactionResponseDTO } from 'src/application';
import { EntryDbRow, OperationDbRow, TransactionDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { Amount, Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/server';
import { beforeEach, describe, expect, it } from 'vitest';

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

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

    await server.ready();

    const user = await testDB.createUser(testUser);

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = Id.fromPersistence(decoded.userId).valueOf();
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const account1 = await testDB.createAccount(userId, {
        name: 'Checking',
      });

      const account2 = await testDB.createAccount(userId, {
        name: 'Savings',
      });

      const fromOperation = {
        accountId: account1.id,
        amount: '-100',
        description: 'Transfer from checking',
      };

      const toOperation = {
        accountId: account2.id,
        amount: '100',
        description: 'Transfer to savings',
      };

      const payload = {
        description: 'some transaction',
        entries: [[fromOperation, toOperation]],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
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
      expect(transaction.entries.length).toBe(payload.entries.length);
      transaction.entries.forEach((entry) => {
        expect(entry.userId).toBe(userId);
        expect(entry.operations.length).toBe(2);
      });
    });

    it('should fail when required fields are missing', async () => {
      const payload = {
        // missing description, entries, postingDate, transactionDate
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
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });
      const account2 = await testDB.createAccount(userId, { name: 'Savings' });

      const payload = {
        description: 'invalid amount',
        entries: [
          [
            {
              accountId: account1.id,
              amount: 'not-a-number',
              description: 'Invalid amount',
            },
            {
              accountId: account2.id,
              amount: '100',
              description: 'Valid amount',
            },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
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
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });
      const account2 = await testDB.createAccount(userId, { name: 'Savings' });

      const payload = {
        description: 'unauthorized',
        entries: [
          [
            {
              accountId: account1.id,
              amount: '-100',
              description: 'Transfer from checking',
            },
            {
              accountId: account2.id,
              amount: '100',
              description: 'Transfer to savings',
            },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
      };

      const response = await server.inject({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it.skip('should fail for non-existent accounts', async () => {
      const payload = {
        description: 'non-existent account',
        entries: [
          [
            { accountId: 'non-existent-id', amount: '-100' },
            { accountId: 'another-non-existent-id', amount: '100' },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
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

    it.skip('should fail for zero amounts', async () => {
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });
      const account2 = await testDB.createAccount(userId, { name: 'Savings' });

      const payload = {
        description: 'zero amount',
        entries: [
          [
            { accountId: account1.id, amount: '0' },
            { accountId: account2.id, amount: '0' },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
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

    it.skip('should fail when from and to accounts are the same', async () => {
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });

      const payload = {
        description: 'same accounts',
        entries: [
          [
            { accountId: account1.id, amount: '-100' },
            { accountId: account1.id, amount: '100' },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
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
  });

  describe('GET /api/transactions/:id', () => {
    let transaction: TransactionDbRow;
    let entries: EntryDbRow[];
    const entryOperationsMap: Record<UUID, OperationDbRow[]> = {};

    const entry1operationData = [
      {
        amount: Amount.create('-100').valueOf(),
        description: 'Transfer from checking',
        isSystem: false,
      },
      {
        amount: Amount.create('100').valueOf(),
        description: 'Transfer to savings',
        isSystem: false,
      },
    ];

    const entry2operationData = [
      {
        amount: Amount.create('50').valueOf(),
        description: 'Deposit to checking',
        isSystem: false,
      },
      {
        amount: Amount.create('-50').valueOf(),
        description: 'Withdrawal from savings',
        isSystem: false,
      },
    ];

    beforeEach(async () => {
      const accounts = await Promise.all([
        testDB.createAccount(userId, {
          name: 'Checking',
        }),
        testDB.createAccount(userId, {
          name: 'Savings',
        }),
      ]);

      transaction = await testDB.createTransaction(userId);

      entries = await Promise.all([
        testDB.createEntry(userId, {
          transactionId: transaction.id,
        }),
        testDB.createEntry(userId, {
          transactionId: transaction.id,
        }),
      ]);

      const entry1ps = await Promise.all(
        entry1operationData.map((opData) => {
          return testDB.createOperation(userId, {
            accountId: opData.amount.startsWith('-')
              ? accounts[0].id
              : accounts[1].id,
            entryId: entries[0].id,
            ...opData,
          });
        }),
      );

      const entry2ps = await Promise.all(
        entry2operationData.map((opData) => {
          return testDB.createOperation(userId, {
            accountId: opData.amount.startsWith('-')
              ? accounts[1].id
              : accounts[0].id,
            entryId: entries[1].id,
            ...opData,
          });
        }),
      );

      entryOperationsMap[entries[0].id] = entry1ps;
      entryOperationsMap[entries[1].id] = entry2ps;
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
      expect(transactionResponse.entries.length).toBe(entries.length);

      transactionResponse.entries.forEach((entry) => {
        expect(entry.userId).toBe(userId);
        const originalEntry = entries.find((e) => e.id === entry.id);
        expect(originalEntry).toBeDefined();
        expect(entry.operations.length).toBe(2);
        expect(entry.transactionId).toBe(transaction.id);
        expect(entry.id).toBe(originalEntry?.id);
        expect(entry.createdAt).toBe(originalEntry?.createdAt);
        expect(entry.updatedAt).toBe(originalEntry?.updatedAt);

        entry.operations.forEach((op, index) => {
          const originalOp = entryOperationsMap[entry.id][index];

          expect(op.id).toBe(originalOp.id);
          expect(op.userId).toBe(userId);
          expect(op.entryId).toBe(entry.id);
          expect(op.amount).toBe(originalOp.amount);
          expect(op.description).toBe(originalOp.description);
          expect(op.createdAt).toBe(originalOp.createdAt);
          expect(op.updatedAt).toBe(originalOp.updatedAt);
        });
      });
    });
  });
});
