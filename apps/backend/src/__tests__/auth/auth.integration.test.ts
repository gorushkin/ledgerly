import { createTestDb } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, it, expect, beforeEach, afterAll } from 'vitest';

type AuthSuccessResponse = {
  token: string;
};

type AuthErrorResponse = {
  error: boolean;
  message: string;
};

describe('Auth Integration Tests', () => {
  let testDbInstance: ReturnType<typeof createTestDb>;
  let server: ReturnType<typeof createServer>;

  beforeEach(async () => {
    testDbInstance = createTestDb();
    server = createServer(testDbInstance.db);
    await testDbInstance.setupTestDb();
  });

  afterAll(async () => {
    await testDbInstance.cleanupTestDb();
  });

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

  describe('POST /api/auth/register', () => {
    it('should register a new user and return JWT token', async () => {
      const response = await server.inject({
        method: 'POST',
        payload: testUser,
        url: '/api/auth/register',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as AuthSuccessResponse;
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
    });

    it('should not allow duplicate email registration', async () => {
      await server.inject({
        method: 'POST',
        payload: testUser,
        url: '/api/auth/register',
      });

      const response = await server.inject({
        method: 'POST',
        payload: testUser,
        url: '/api/auth/register',
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body) as AuthErrorResponse;
      expect(body.error).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Register a user before each login test
      await server.inject({
        method: 'POST',
        payload: testUser,
        url: '/api/auth/register',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        payload: {
          email: testUser.email,
          password: testUser.password,
        },
        url: '/api/auth/login',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body) as AuthSuccessResponse;
      expect(body).toHaveProperty('token');
      expect(typeof body.token).toBe('string');
    });

    it('should fail with incorrect password', async () => {
      const response = await server.inject({
        method: 'POST',
        payload: {
          email: testUser.email,
          password: 'wrongpassword',
        },
        url: '/api/auth/login',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body) as AuthErrorResponse;
      expect(body.error).toBe(true);
    });

    it('should fail with non-existent email', async () => {
      const response = await server.inject({
        method: 'POST',
        payload: {
          email: 'nonexistent@example.com',
          password: testUser.password,
        },
        url: '/api/auth/login',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body) as AuthErrorResponse;
      expect(body.error).toBe(true);
    });
  });
});
