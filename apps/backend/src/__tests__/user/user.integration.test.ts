import { ROUTES } from '@ledgerly/shared/routes';
import {
  ErrorResponse,
  UsersResponseDTO,
  UUID,
  ValidationError,
} from '@ledgerly/shared/types';
import { TestDB } from 'src/db/test-db';
import { Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/server';
import { describe, it, expect, beforeEach } from 'vitest';

const url = `/api${ROUTES.user}`;
const fakeUserId = Id.create().valueOf();

const passwordUrl = `${url}/password`;

describe.skip('User Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: string;

  const testUser = {
    email: 'test@example.com',
    name: 'Test User',
    password: 'Password123!',
  };

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

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

      const user = JSON.parse(response.body) as UsersResponseDTO;

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
          userId: fakeUserId,
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

      expect(response.statusCode).toBe(404);
      expect(error.message).toBe(`User with ID ${fakeUserId} not found`);
    });

    it.todo('should fail with invalid auth token');
    it.todo('should fail with expired auth token');
    it.todo('should fail with malformed auth token');
    it.todo('should handle database connection errors gracefully');
    it.todo('should return consistent response format');
    it.todo('should not return sensitive information');
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
      const user = JSON.parse(response.body) as UsersResponseDTO;
      expect(user).toHaveProperty('email', updatedData.email);
      expect(user).toHaveProperty('name', updatedData.name);
      expect(user).not.toHaveProperty('password');
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
          userId: fakeUserId,
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

      expect(response.statusCode).toBe(404);

      expect(error.message).toBe(`User with ID ${fakeUserId} not found`);
    });

    it.todo('should update only name field when email is not provided');
    it.todo('should update only email field when name is not provided');
    it.todo('should return 400 when email exceeds 255 characters');
    it.todo('should return 400 when name is not a string');
    it.todo('should return 400 when email is not a string');
    it.todo('should automatically trim and lowercase email');
    it.todo('should validate email format strictly');
    it.todo('should return 400 when extra unexpected fields are provided');
    it.todo('should handle Content-Type validation');
    it.todo('should handle malformed JSON in request body');
    it.todo('should prevent email duplication with other users');
    it.todo('should handle database constraint errors');
    it.todo('should handle concurrent update requests');
    it.todo('should preserve user ID during update');
    it.todo('should update timestamps correctly');
    it.todo('should fail with invalid auth token');
    it.todo('should fail with expired auth token');
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

      const result = JSON.parse(response.body) as UsersResponseDTO;
      expect(response.statusCode).toBe(200);
      expect(result).toHaveProperty('message', 'Profile successfully deleted');

      const getResponse = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(getResponse.statusCode).toBe(404);
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
          userId: fakeUserId,
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

      expect(response.statusCode).toBe(404);
      const error = JSON.parse(response.body) as ErrorResponse;
      expect(error.message).toBe(`User with ID ${fakeUserId} not found`);
    });

    it.todo(
      'should cascade delete related data (accounts, transactions, etc.)',
    );
    it.todo('should fail with invalid auth token');
    it.todo('should fail with expired auth token');
    it.todo('should return consistent response format');
    it.todo('should handle database transaction rollback on errors');
    it.todo('should invalidate all user sessions/tokens after deletion');
    it.todo('should handle concurrent deletion attempts');
    it.todo('should log user deletion for audit purposes');
    it.todo('should handle soft delete vs hard delete scenarios');
  });

  describe('PUT /password - Change Password', () => {
    it('should change password successfully', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: {
          currentPassword: testUser.password,
          newPassword: 'NewPassword123',
        },
        url: passwordUrl,
      });

      const result = JSON.parse(response.body) as { message: string };

      expect(response.statusCode).toBe(200);
      expect(result).toHaveProperty('message', 'Password successfully changed');
    });

    it('should return 400 for missing currentPassword', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: {
          newPassword: 'NewPassword123',
        },
        url: passwordUrl,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for wrong currentPassword', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123',
        },
        url: passwordUrl,
      });

      const error = JSON.parse(response.body) as ErrorResponse;

      expect(response.statusCode).toBe(401);
      expect(error.message).toBe('Invalid password');
    });

    it('should return 400 for weak newPassword', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'PUT',
        payload: {
          currentPassword: testUser.password,
          newPassword: '123',
        },
        url: passwordUrl,
      });

      const error = JSON.parse(response.body) as ValidationError;
      const errorMessage = error.errors[0].message;

      expect(response.statusCode).toBe(400);
      expect(errorMessage).toBe('String must contain at least 8 character(s)');
    });

    it('should fail without auth token', async () => {
      const response = await server.inject({
        method: 'PUT',
        payload: {
          currentPassword: testUser.password,
          newPassword: '123',
        },
        url: passwordUrl,
      });

      expect(response.statusCode).toBe(401);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeToken = server.jwt.sign(
        {
          email: 'fake@example.com',
          userId: fakeUserId,
        },
        { expiresIn: '1h' },
      );

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${fakeToken}`,
        },
        method: 'PUT',
        payload: {
          currentPassword: testUser.password,
          newPassword: '1234567890',
        },
        url: passwordUrl,
      });
      const error = JSON.parse(response.body) as ErrorResponse;

      expect(response.statusCode).toBe(401);
      expect(error.message).toBe('User not found');
    });

    it.todo('should return 400 for missing newPassword');
    it.todo('should return 400 when currentPassword is empty string');
    it.todo('should return 400 when newPassword is empty string');
    it.todo('should return 400 when currentPassword is not a string');
    it.todo('should return 400 when newPassword is not a string');
    it.todo('should return 400 when newPassword exceeds 255 characters');
    it.todo('should hash new password before storing');
    it.todo('should verify new password can be used for login');
    it.todo('should return 400 when new password same as current');
    it.todo('should return 400 when extra unexpected fields provided');
    it.todo('should handle Content-Type validation');
    it.todo('should handle malformed JSON in request body');
    it.todo('should fail with invalid auth token');
    it.todo('should fail with expired auth token');
    it.todo('should handle database errors during password update');
    it.todo('should invalidate existing sessions after password change');
    it.todo('should log password change attempts for security');
    it.todo('should handle concurrent password change requests');
    it.todo('should enforce password complexity rules');
    it.todo('should prevent password reuse (if implemented)');
  });
});
