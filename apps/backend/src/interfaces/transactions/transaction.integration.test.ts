import { ROUTES } from '@ledgerly/shared/routes';
import { UUID } from '@ledgerly/shared/types';
import { TransactionResponseDTO } from 'src/application';
import { TestDB } from 'src/db/test-db';
import { Id } from 'src/domain/domain-core';
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
            { accountId: account1.id, amount: 'not-a-number' },
            { accountId: account2.id, amount: '100' },
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
            { accountId: account1.id, amount: '-100' },
            { accountId: account2.id, amount: '100' },
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

  it.todo('should fail when required fields are missing');
});
