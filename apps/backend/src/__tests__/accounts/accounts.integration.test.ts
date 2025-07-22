import { ROUTES } from '@ledgerly/shared/routes';
import {
  AccountCreate,
  AccountResponse,
  AccountType,
  UUID,
} from '@ledgerly/shared/types';
import { createTestDb } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, afterAll, beforeEach, it, expect } from 'vitest';

const url = `/api${ROUTES.accounts}`;

const firstUserAccounts = [
  {
    name: 'Test Account',
    originalCurrency: 'USD',
    type: 'cash' as AccountType,
  },
  {
    name: 'Savings Account',
    originalCurrency: 'EUR',
    type: 'cash' as AccountType,
  },
];

const getUserTestAccounts = (userId: UUID): AccountCreate[] => {
  return firstUserAccounts.map((account) => ({
    ...account,
    userId,
  }));
};

describe('Accounts Integration Tests', () => {
  let testDbInstance: ReturnType<typeof createTestDb>;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: string;
  let accounts: AccountResponse[];

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

  beforeEach(async () => {
    testDbInstance = createTestDb();
    server = createServer(testDbInstance.db);
    await testDbInstance.setupTestDb();

    await server.ready();

    const user = await testDbInstance.createUser(testUser);

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = decoded.userId;

    const testAccounts = getUserTestAccounts(userId);

    const promises = testAccounts.map((account) =>
      testDbInstance.createTestAccount(userId, account),
    );

    accounts = await Promise.all(promises);
  });

  afterAll(async () => {
    await testDbInstance.cleanupTestDb();
  });

  describe('GET /api/accounts', () => {
    it('should return all accounts for the user', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      firstUserAccounts.forEach((account) => {
        expect(response.body).toContain(account.name);
      });

      expect(response.statusCode).toBe(200);
    });
  });

  describe('GET /api/accounts/:id', () => {
    it('should return account by ID', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${accounts[0].id}`,
      });

      const account = JSON.parse(response.body) as AccountResponse;

      expect(response.statusCode).toBe(200);
      expect(account.name).toBe(accounts[0].name);
    });
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const newAccount = {
        description: 'This is a new account',
        name: 'New Account',
        originalCurrency: 'USD',
        type: 'cash' as AccountType,
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload: newAccount,
        url,
      });

      const createdAccount = JSON.parse(response.body) as AccountResponse;

      expect(response.statusCode).toBe(201);
      expect(createdAccount.name).toBe(newAccount.name);
      expect(createdAccount.originalCurrency).toBe(newAccount.originalCurrency);
      expect(createdAccount.type).toBe(newAccount.type);
      expect(createdAccount.description).toBe(newAccount.description);

      const finalResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      const accountsAfterCreation = JSON.parse(
        finalResponse.body,
      ) as AccountResponse[];

      expect(accountsAfterCreation.length).toBe(firstUserAccounts.length + 1);
      expect(accountsAfterCreation).toContainEqual(createdAccount);
    });
  });

  describe('DELETE /api/accounts/:id', () => {
    it('should delete an account by ID', async () => {
      const accountToDelete = accounts[0];

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url: `${url}/${accountToDelete.id}`,
      });

      expect(response.statusCode).toBe(200);
      expect(response.body).toContain(accountToDelete.id);
      expect(response.body).toContain('Account successfully deleted');

      const finalResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      const accountsAfterDeletion = JSON.parse(
        finalResponse.body,
      ) as AccountResponse[];

      expect(accountsAfterDeletion.length).toBe(firstUserAccounts.length - 1);
      expect(accountsAfterDeletion).not.toContainEqual(accountToDelete);
    });
  });

  describe('PUT /api/accounts/:id', () => {
    it('should update an account by ID', async () => {
      const accountToUpdate = accounts[0];

      const updatedData = {
        name: 'Updated Account Name',
        originalCurrency: 'EUR',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url: `${url}/${accountToUpdate.id}`,
      });

      const updatedAccount = JSON.parse(response.body) as AccountResponse;

      expect(response.statusCode).toBe(200);
      expect(updatedAccount.name).toBe(updatedData.name);
      expect(updatedAccount.originalCurrency).toBe(
        updatedData.originalCurrency,
      );

      const finalResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      const accountsAfterUpdate = JSON.parse(
        finalResponse.body,
      ) as AccountResponse[];

      expect(accountsAfterUpdate).toContainEqual(updatedAccount);
    });
  });
});
