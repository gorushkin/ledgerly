import { ROUTES } from '@ledgerly/shared/routes';
import {
  AccountCreateDTO,
  AccountInsertDTO,
  AccountResponseDTO,
  AccountType,
  UUID,
} from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, beforeEach, it, expect } from 'vitest';

const url = `/api${ROUTES.accounts}`;

const firstUserAccounts = [
  {
    initialBalance: 1000,
    name: 'Test Account',
    originalCurrency: 'USD',
    type: 'asset' as AccountType,
  },
  {
    currentClearedBalanceLocal: 0,
    initialBalance: 1000,
    name: 'Savings Account',
    originalCurrency: 'EUR',
    type: 'cash' as AccountType,
  },
];

const getUserTestAccounts = (userId: UUID): AccountCreateDTO[] => {
  return firstUserAccounts.map((account) => ({
    ...account,
    userId,
  }));
};

describe('Accounts Integration Tests', () => {
  let testDB: TestDB;

  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: string;
  let accounts: AccountResponseDTO[];

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

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
    userId = decoded.userId;

    const testAccounts = getUserTestAccounts(userId);

    const promises = testAccounts.map((account) =>
      testDB.createAccount(userId, account),
    );

    accounts = await Promise.all(promises);
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

      const account = JSON.parse(response.body) as AccountInsertDTO;

      expect(response.statusCode).toBe(200);
      expect(account.name).toBe(accounts[0].name);
    });
  });

  describe('POST /api/accounts', () => {
    it('should create a new account', async () => {
      const newAccount = {
        description: 'This is a new account',
        initialBalance: 500,
        name: 'New Account',
        originalCurrency: 'USD',
        type: 'asset' as AccountType,
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload: newAccount,
        url,
      });

      const createdAccount = JSON.parse(response.body) as AccountInsertDTO;

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
      ) as AccountInsertDTO[];

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

      expect(response.statusCode).toBe(204);

      const finalResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      const accountsAfterDeletion = JSON.parse(
        finalResponse.body,
      ) as AccountInsertDTO[];

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

      const updatedAccount = JSON.parse(response.body) as AccountInsertDTO;

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
      ) as AccountInsertDTO[];

      expect(accountsAfterUpdate).toContainEqual(updatedAccount);
    });
  });

  // Authentication & Authorization Tests
  describe.todo('Authentication & Authorization', () => {
    // - should return 401 when no auth token provided
    // - should return 401 when invalid auth token provided
    // - should return 401 when expired auth token provided
    // - should return 403 when trying to access another user's account
    // - should return 403 when trying to update another user's account
    // - should return 403 when trying to delete another user's account
  });

  // Validation Tests for POST /api/accounts
  describe.todo('POST /api/accounts - Validation', () => {
    // - should return 400 when name is empty
    // - should return 400 when name is missing
    // - should return 400 when name is not a string
    // - should return 400 when originalCurrency is empty
    // - should return 400 when originalCurrency is missing
    // - should return 400 when originalCurrency is invalid format
    // - should return 400 when originalCurrency doesn't exist in database
    // - should return 400 when type is empty
    // - should return 400 when type is invalid enum value
    // - should return 400 when type is missing
    // - should return 400 when userId is missing
    // - should return 400 when userId is invalid UUID format
    // - should return 409 when account name already exists for user
    // - should return 400 when description is not a string
    // - should return 400 when initialBalance is not a number
    // - should return 400 when extra unexpected fields are provided
  });

  // Validation Tests for PUT /api/accounts/:id
  describe.todo('PUT /api/accounts/:id - Validation', () => {
    // - should return 400 when name is empty string
    // - should return 400 when name is not a string
    // - should return 400 when originalCurrency is empty
    // - should return 400 when originalCurrency doesn't exist in database
    // - should return 400 when type is invalid enum value
    // - should return 400 when description is not a string
    // - should return 404 when account ID doesn't exist
    // - should return 400 when account ID is invalid UUID format
    // - should return 409 when updating to duplicate name within same user
    // - should return 400 when empty object is provided
    // - should return 400 when extra unexpected fields are provided
    // - should allow updating to name that exists for different user
  });

  // Edge Cases for GET /api/accounts/:id
  describe.todo('GET /api/accounts/:id - Edge Cases', () => {
    // - should return 404 when account ID doesn't exist
    // - should return 400 when account ID is invalid UUID format
    // - should return 404 when account belongs to different user
  });

  // Edge Cases for DELETE /api/accounts/:id
  describe.todo('DELETE /api/accounts/:id - Edge Cases', () => {
    // - should return 404 when account ID doesn't exist
    // - should return 400 when account ID is invalid UUID format
    // - should return 404 when trying to delete another user's account
    // - should handle deletion of account with transactions (cascade)
  });

  // Foreign Key Constraint Tests
  describe.todo('Foreign Key Constraints', () => {
    // - should handle user deletion cascading to accounts
    // - should prevent creation with non-existent currency
    // - should prevent update with non-existent currency
  });

  // Business Logic Tests
  describe.todo('Business Logic', () => {
    // - should allow multiple accounts with same name for different users
    // - should preserve other fields when partially updating account
    // - should handle account creation with all optional fields
    // - should handle account update with only one field changed
    // - should maintain data integrity during concurrent operations
  });

  // Database Consistency Tests
  describe.todo('Database Consistency', () => {
    // - should maintain unique constraint on (userId, name)
    // - should properly set created_at and updated_at timestamps
    // - should handle database connection errors gracefully
    // - should rollback on transaction failures
  });

  // Content-Type and Request Format Tests
  describe.todo('Request Format', () => {
    // - should return 400 when Content-Type is not application/json
    // - should return 400 when request body is not valid JSON
    // - should return 400 when request body is null
    // - should return 400 when request body is array instead of object
  });

  // Response Format Tests
  describe.todo('Response Format', () => {
    // - should return proper error format for validation errors
    // - should include all required fields in successful responses
    // - should not include sensitive data in responses
    // - should return consistent error structure across endpoints
  });

  // Performance and Limits Tests
  describe.todo('Performance & Limits', () => {
    // - should handle very long account names (within limits)
    // - should handle maximum number of accounts per user
    // - should handle special characters in account names
    // - should handle unicode characters in account names
  });
});
