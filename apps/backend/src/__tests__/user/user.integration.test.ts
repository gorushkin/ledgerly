import { ROUTES } from '@ledgerly/shared/routes';
import { ErrorResponse, UsersResponse, UUID } from '@ledgerly/shared/types';
import { createTestDb } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, it, expect, afterAll, beforeAll, beforeEach } from 'vitest';

const url = `/api${ROUTES.user}`;

describe('User Integration Tests', () => {
  const { cleanupTestDb, db, setupTestDb } = createTestDb();
  const server = createServer(db);
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

  beforeAll(async () => {
    await setupTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
    await setupTestDb();

    const response = await server.inject({
      method: 'POST',
      payload: testUser,
      url: '/api/auth/register',
    });

    const { token } = JSON.parse(response.body) as { token: string };

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = decoded.userId;
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('GET /api/user', () => {
    it('should get user profile successfully', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(1).toBe(1);

      const user = JSON.parse(response.body) as UsersResponse;

      expect(response.statusCode).toBe(200);
      expect(user).toHaveProperty('email', testUser.email);
      expect(user).toHaveProperty('id', userId);
      expect(user).toHaveProperty('name', testUser.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should fail without auth token', async () => {
      const response = await server.inject({
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeToken = server.jwt.sign(
        {
          email: 'fake@example.com',
          userId: '999999',
        },
        { expiresIn: '1h' },
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
        method: 'GET',
        url,
      });

      const error = JSON.parse(response.body) as ErrorResponse;

      expect(response.statusCode).toBe(401);
      expect(error.message).toBe('User not found');
    });
  });

  describe('PUT /api/user', () => {
    it('should update user profile successfully', async () => {
      const updatedData = {
        email: 'updated@example.com',
        name: 'Updated Name',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url,
      });

      expect(response.statusCode).toBe(200);
      const user = JSON.parse(response.body) as UsersResponse;
      expect(user).toHaveProperty('email', updatedData.email);
      expect(user).toHaveProperty('name', updatedData.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: '',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: invalidData,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail without auth token', async () => {
      const response = await server.inject({
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

    it('should fail with non-existent user ID', async () => {
      const fakeToken = server.jwt.sign(
        {
          email: 'fake@example.com',
          userId: '999999',
        },
        { expiresIn: '1h' },
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
        method: 'PUT',
        payload: {
          email: 'test@example.com',
          name: 'Test',
        },
        url,
      });
      const error = JSON.parse(response.body) as ErrorResponse;

      expect(response.statusCode).toBe(401);

      expect(error.message).toBe('User not found');
    });
  });

  describe('DELETE /api/user', () => {
    it('should delete user profile successfully', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url,
      });

      const result = JSON.parse(response.body) as UsersResponse;
      expect(response.statusCode).toBe(200);
      expect(result).toHaveProperty('message', 'Profile successfully deleted');

      const getResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(getResponse.statusCode).toBe(401);
    });

    it('should fail without auth token', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeToken = server.jwt.sign(
        {
          email: 'fake@example.com',
          userId: '999999',
        },
        { expiresIn: '1h' },
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
        method: 'DELETE',
        url,
      });

      expect(response.statusCode).toBe(401);
      const error = JSON.parse(response.body);
      expect(error.message).toBe('User not found');
    });
  });
});
