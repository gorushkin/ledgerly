import { ROUTES } from '@ledgerly/shared/routes';
import { CategoryCreate, CategoryResponse, UUID } from '@ledgerly/shared/types';
import { createTestDb } from 'src/db/test-db';
import { createServer } from 'src/presentation/server';
import { describe, beforeEach, it, expect } from 'vitest';

const url = `/api${ROUTES.categories}`;

const firstUserCategory = [
  {
    name: 'First User Category',
  },
  { name: 'Second User Category' },
];

describe('Category Integration Tests', () => {
  let testDbInstance: ReturnType<typeof createTestDb>;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: string;
  let categories: CategoryResponse[];
  const headers: Record<string, string> = {};

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

    const promises = firstUserCategory.map((account) =>
      testDbInstance.createTestCategory(userId, account),
    );

    categories = await Promise.all(promises);

    headers.Authorization = `Bearer ${authToken}`;
  });

  describe('GET /categories', () => {
    it('should return all categories for the authenticated user', async () => {
      const response = await server.inject({
        headers,
        method: 'GET',
        url,
      });

      const categories = JSON.parse(response.body) as CategoryResponse[];

      expect(response.statusCode).toBe(200);

      firstUserCategory.forEach((category, index) => {
        expect(categories[index].name).toBe(category.name);
      });

      expect(categories.length).toBe(firstUserCategory.length);
      expect(categories[0].userId).toBe(userId);
      expect(categories[1].userId).toBe(userId);
    });
  });

  describe('GET /categories/:id', async () => {
    it('should return a category by id for the authenticated user', async () => {
      const response = await server.inject({
        headers,
        method: 'GET',
        url: `${url}/${categories[0].id}`,
      });

      expect(response.statusCode).toBe(200);

      const category = JSON.parse(response.body) as CategoryResponse;

      expect(category.name).toBe(firstUserCategory[0].name);
      expect(category.userId).toBe(userId);
    });
  });

  describe('POST /categories', () => {
    it('should create a new category for the authenticated user', async () => {
      const newCategory: CategoryCreate = {
        name: 'New Category',
        userId,
      };

      const response = await server.inject({
        headers,
        method: 'POST',
        payload: newCategory,
        url,
      });

      const createdCategory = JSON.parse(response.body) as CategoryResponse;

      expect(response.statusCode).toBe(201);
      expect(createdCategory.name).toBe(newCategory.name);
      expect(createdCategory.userId).toBe(userId);
    });
  });

  describe('PUT /categories/:id', () => {
    it('should update an existing category for the authenticated user', async () => {
      const updatedCategory: CategoryCreate = {
        name: 'Updated Category',
        userId,
      };

      const response = await server.inject({
        headers,
        method: 'PUT',
        payload: updatedCategory,
        url: `${url}/${categories[0].id}`,
      });

      expect(response.statusCode).toBe(200);

      const category = JSON.parse(response.body) as CategoryResponse;

      expect(category.name).toBe(updatedCategory.name);
      expect(category.userId).toBe(userId);
    });
  });

  describe('DELETE /categories/:id', () => {
    it('should delete a category for the authenticated user', async () => {
      const response = await server.inject({
        headers,
        method: 'DELETE',
        url: `${url}/${categories[0].id}`,
      });

      expect(response.statusCode).toBe(204);

      const getResponse = await server.inject({
        headers,
        method: 'GET',
        url: `${url}/${categories[0].id}`,
      });

      expect(getResponse.statusCode).toBe(404);
    });

    it.todo('should return 404 when deleting non-existent category');
    it.todo('should return 403 when deleting category of another user');
  });

  describe('Authentication & Authorization', () => {
    it.todo('should return 401 for GET /categories without token');
    it.todo('should return 401 for POST /categories without token');
    it.todo('should return 401 for PUT /categories/:id without token');
    it.todo('should return 401 for DELETE /categories/:id without token');
    it.todo('should return 401 with invalid JWT token');
    it.todo('should return 401 with expired JWT token');
  });

  describe('Validation & Error Handling', () => {
    it.todo('should return 400 for POST with empty name');
    it.todo('should return 400 for POST with name too long');
    it.todo('should return 400 for POST with invalid characters in name');
    it.todo('should return 409 for POST with duplicate category name');
    it.todo('should return 400 for PUT with empty name');
    it.todo('should return 409 for PUT with duplicate category name');
    it.todo('should return 400 for invalid category ID format');
  });

  describe('Edge Cases', () => {
    it.todo('should handle GET /categories when user has no categories');
    it.todo('should return 404 for GET /categories/:id with non-existent id');
    it.todo('should return 404 for PUT /categories/:id with non-existent id');
    it.todo('should handle concurrent category creation');
    it.todo('should handle very long category names (boundary testing)');
  });

  describe('Data Isolation', () => {
    it.todo('should not return categories from other users');
    it.todo('should not allow updating categories of other users');
    it.todo('should not allow deleting categories of other users');
  });

  describe('Content-Type & Request Format', () => {
    it.todo('should return 400 for POST without Content-Type header');
    it.todo('should return 400 for POST with invalid JSON');
    it.todo('should return 400 for PUT without Content-Type header');
    it.todo('should handle POST with extra fields in payload');
  });

  describe('Performance & Limits', () => {
    it.todo('should handle creating maximum allowed categories');
    it.todo('should return 429 for too many requests (rate limiting)');
  });
});
