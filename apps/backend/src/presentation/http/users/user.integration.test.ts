import { ROUTES } from '@ledgerly/shared/routes';
import { UserResponseDTO, UUID } from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/http';
import {
  createHttpTestClient,
  HttpTestClient,
} from 'src/presentation/http/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

const url = `/api${ROUTES.user}`;

describe('User Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: string;

  let httpClient: HttpTestClient;

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

    httpClient = createHttpTestClient(server, () => authToken);

    const { token } = await httpClient.registerAndGetToken(testUser);

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = decoded.userId;
  });

  describe('GET /api/user', () => {
    it('should get user profile successfully', async () => {
      const response = await httpClient.injectAuthorized({
        method: 'GET',
        url,
      });

      const user = httpClient.parseResponse<UserResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(user).toHaveProperty('email', testUser.email);
      expect(user).toHaveProperty('id', userId);
      expect(user).toHaveProperty('name', testUser.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should fail without auth token', async () => {
      const response = await httpClient.injectUnauthenticated({
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail when auth token references a missing user', async () => {
      const token = httpClient.signAuthToken({
        email: 'missing@example.com',
        userId: Id.create().valueOf(),
      });

      const response = await httpClient.injectWithToken(token, {
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should handle database connection errors gracefully', async () => {
      testDB.close();

      const response = await httpClient.injectAuthorized({
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(500);
    });

    it('should return consistent response format', async () => {
      const response = await httpClient.injectAuthorized({
        method: 'GET',
        url,
      });

      const user = httpClient.parseResponse<UserResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(user).toHaveProperty('email', testUser.email);
      expect(user).toHaveProperty('id', userId);
      expect(user).toHaveProperty('name', testUser.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should not return sensitive information', async () => {
      const response = await httpClient.injectAuthorized({
        method: 'GET',
        url,
      });

      const user = httpClient.parseResponse<UserResponseDTO>(response);

      expect(response.statusCode).toBe(200);
      expect(user).not.toHaveProperty('password');
      expect(user).not.toHaveProperty('createdAt');
      expect(user).not.toHaveProperty('updatedAt');
    });
  });

  describe('PUT /api/user', () => {
    it('should update user profile successfully', async () => {
      const updatedData = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(200);

      const user = httpClient.parseResponse<UserResponseDTO>(response);
      expect(user).toHaveProperty('email', updatedData.email);
      expect(user).toHaveProperty('name', updatedData.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should preserve user ID during update', async () => {
      const updatedData = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(200);

      const user = httpClient.parseResponse<UserResponseDTO>(response);
      expect(user).toHaveProperty('id', userId);
    });

    const invalidBodies = [
      ['invalid email', { email: 'invalid-email', name: 'Test' }],
      ['empty email', { email: '', name: 'Test' }],
      ['empty name', { email: 'test@example.com', name: '' }],
      ['empty body', {}],
      ['null body', null],
      ['undefined body', undefined],
      ['email as number', { email: 123, name: 'Test' }],
    ] as [string, { email: string; name: string }][];

    it.each(invalidBodies)('should fail with %s', async (_, invalidData) => {
      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: invalidData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail without auth token', async () => {
      const response = await httpClient.injectUnauthenticated({
        method: 'PUT',
        payload: {
          email: 'test@example.com',
          name: 'Test',
          password: 'Password123!',
        },
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should update only name field when email is not provided', async () => {
      const updatedData = {
        name: 'Updated Name Only',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(200);

      const user = httpClient.parseResponse<UserResponseDTO>(response);
      expect(user).toHaveProperty('name', updatedData.name);
      expect(user).toHaveProperty('email', testUser.email); // Email should remain unchanged
      expect(user).not.toHaveProperty('password');
    });

    it('should update only email field when name is not provided', async () => {
      const updatedData = {
        email: 'updated@example.com',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(200);

      const user = httpClient.parseResponse<UserResponseDTO>(response);
      expect(user).toHaveProperty('email', updatedData.email);
      expect(user).toHaveProperty('name', testUser.name); // Name should remain unchanged
      expect(user).not.toHaveProperty('password');
    });

    it('should return 400 when email exceeds 255 characters', async () => {
      const updatedData = {
        email: 'a'.repeat(256) + '@example.com',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when name is not a string', async () => {
      const updatedData = {
        name: 123,
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when email is not a string', async () => {
      const updatedData = {
        email: 123,
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should automatically trim and lowercase email', async () => {
      const updatedData = {
        email: '  UPPerCASE@example.com  ',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(200);

      const user = httpClient.parseResponse<UserResponseDTO>(response);

      expect(user).toHaveProperty('email', 'uppercase@example.com');
      expect(user).not.toHaveProperty('password');
    });

    it('should validate email format strictly', async () => {
      const updatedData = {
        email: 'invalid-email-format',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 when extra unexpected fields are provided', async () => {
      const updatedData = {
        unexpectedField: 'unexpected',
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should prevent email duplication with other users', async () => {
      const otherUserEmail = 'existing@example.com';

      await testDB.createUser({
        email: otherUserEmail,
        name: 'Existing User',
        password: 'Password123!',
      });

      const updatedData = {
        email: otherUserEmail,
      };

      const response = await httpClient.injectAuthorized({
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(409);
    });
  });
});
