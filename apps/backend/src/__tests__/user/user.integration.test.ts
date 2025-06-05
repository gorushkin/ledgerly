import { createTestDb } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';

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

    // Register a user and get token before each test
    const response = await server.inject({
      method: 'POST',
      payload: testUser,
      url: '/api/auth/register',
    });

    const { token } = JSON.parse(response.body);
    authToken = token;

    // Decode the JWT token to get userId
    const decoded = server.jwt.decode(token)!;
    userId = decoded.userId;
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  describe('GET /api/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(200);
      const user = JSON.parse(response.body);
      expect(user).toHaveProperty('email', testUser.email);
      expect(user).toHaveProperty('name', testUser.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should fail without auth token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user ID', async () => {
      // Create a token with a non-existent user ID
      const fakeToken = await server.jwt.sign(
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
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
      const error = JSON.parse(response.body);
      expect(error.message).toBe('User not found');
    });
  });

  describe('PUT /api/profile', () => {
    it('should update user profile successfully', async () => {
      const updatedData = {
        email: 'updated@example.com',
        name: 'Updated Name',
        password: 'NewPassword123!',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: updatedData,
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(200);
      const user = JSON.parse(response.body);
      expect(user).toHaveProperty('email', updatedData.email);
      expect(user).toHaveProperty('name', updatedData.name);
      expect(user).not.toHaveProperty('password');
    });

    it('should fail with invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
        name: '',
        password: '123', // too short
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: invalidData,
        url: '/api/profile',
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
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeToken = await server.jwt.sign(
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
          password: 'Password123!',
        },
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
      const error = JSON.parse(response.body);
      expect(error.message).toBe('User not found');
    });
  });

  describe('DELETE /api/profile', () => {
    it('should delete user profile successfully', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'DELETE',
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(200);
      const result = JSON.parse(response.body);
      expect(result).toHaveProperty('message', 'Profile successfully deleted');

      // Verify profile is actually deleted by trying to fetch it
      const getResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: '/api/profile',
      });
      expect(getResponse.statusCode).toBe(401);
    });

    it('should fail without auth token', async () => {
      const response = await server.inject({
        method: 'DELETE',
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeToken = await server.jwt.sign(
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
        url: '/api/profile',
      });

      expect(response.statusCode).toBe(401);
      const error = JSON.parse(response.body);
      expect(error.message).toBe('User not found');
    });
  });
});
