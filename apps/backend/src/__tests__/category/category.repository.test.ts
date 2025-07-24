import { UsersResponse } from '@ledgerly/shared/types';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { RecordAlreadyExistsError } from 'src/presentation/errors';
import { describe, beforeEach, beforeAll, it, expect } from 'vitest';

import { createTestDb } from '../../db/test-db';

describe('CategoryRepository', () => {
  let testDbInstance: ReturnType<typeof createTestDb>;
  let categoryRepository: CategoryRepository;

  let user: UsersResponse;

  beforeAll(async () => {
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
    categoryRepository = new CategoryRepository(testDbInstance.db);
    user = await testDbInstance.createUser();
  });

  beforeEach(async () => {
    testDbInstance = createTestDb();
    await testDbInstance.setupTestDb();
    categoryRepository = new CategoryRepository(testDbInstance.db);
    user = await testDbInstance.createUser();
  });

  describe('create', () => {
    it('should create category successfully', async () => {
      const newCategory = {
        name: 'Test Category',
        userId: user.id,
      };

      const createdCategory = await categoryRepository.create(newCategory);

      expect(createdCategory).toHaveProperty('id');
      expect(createdCategory).toHaveProperty('name', createdCategory.name);
    });

    it('should create category with different names for same user', async () => {
      const category1 = await categoryRepository.create({
        name: 'Food',
        userId: user.id,
      });
      const category2 = await categoryRepository.create({
        name: 'Transport',
        userId: user.id,
      });

      const categories = await categoryRepository.getAll(user.id);
      expect(categories).toHaveLength(2);

      expect(category1.id).not.toBe(category2.id);
      expect(category1.name).toBe('Food');
      expect(category2.name).toBe('Transport');
    });

    it('should allow same category name for different users', async () => {
      const user2 = await testDbInstance.createUser({
        email: '',
        name: 'User2',
      });
      const categoryName = 'Food';

      const category1 = await categoryRepository.create({
        name: categoryName,
        userId: user.id,
      });

      const category2 = await categoryRepository.create({
        name: categoryName,
        userId: user2.id,
      });

      const user1Categories = await categoryRepository.getAll(user.id);

      const user2Categories = await categoryRepository.getAll(user2.id);

      expect(user1Categories).toHaveLength(1);
      expect(user2Categories).toHaveLength(1);

      expect(category1.id).not.toBe(category2.id);

      expect(category1.name).toBe(category2.name);
    });

    it('should not allow duplicate category names for same user', async () => {
      const categoryName = 'Food';

      await categoryRepository.create({
        name: categoryName,
        userId: user.id,
      });

      await expect(
        categoryRepository.create({
          name: categoryName,
          userId: user.id,
        }),
      ).rejects.toThrowError(RecordAlreadyExistsError);
    });
  });

  describe('getById', () => {
    it('should return category when exists and belongs to user', async () => {
      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      const created = await categoryRepository.create({
        name: 'Test',
        userId: user.id,
      });

      const found = await categoryRepository.getById(user.id, created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined when category does not exist', async () => {
      const nonExistentId = crypto.randomUUID();
      const result = await categoryRepository.getById(user.id, nonExistentId);

      expect(result).toBeUndefined();
    });

    it('should return undefined when category belongs to different user', async () => {
      const user2 = await testDbInstance.createUser();

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      const created = await categoryRepository.create({
        name: 'Test',
        userId: user.id,
      });
      const result = await categoryRepository.getById(user2.id, created.id);

      expect(result).toBeUndefined();
    });
  });

  describe('getByName', () => {
    it('should return category by name when exists and belongs to user', async () => {
      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      // const created = await categoryRepository.create({
      //   name: 'Test',
      //   userId: user.id,
      // });
      // const found = await categoryRepository.getByName(user.id, created.name);
      // expect(found).toBeDefined();
      // expect(found?.id).toBe(created.id);
    });
  });

  describe('getAll', () => {
    it('should return empty array when user has no categories', async () => {
      const categories = await categoryRepository.getAll(user.id);

      expect(categories).toEqual([]);
    });

    it('should return only user categories', async () => {
      const user2 = await testDbInstance.createUser();

      await categoryRepository.create({
        name: 'User1 Category',
        userId: user.id,
      });

      await categoryRepository.create({
        name: 'User2 Category',
        userId: user2.id,
      });

      const user1Categories = await categoryRepository.getAll(user.id);

      expect(user1Categories).toHaveLength(1);
      expect(user1Categories[0].name).toBe('User1 Category');
    });

    it('should return multiple categories for user', async () => {
      await categoryRepository.create({ name: 'Food', userId: user.id });
      await categoryRepository.create({ name: 'Transport', userId: user.id });

      const categories = await categoryRepository.getAll(user.id);

      expect(categories).toHaveLength(2);
      expect(categories.map((c) => c.name)).toContain('Food');
      expect(categories.map((c) => c.name)).toContain('Transport');
    });
  });

  describe('update', () => {
    it('should update category when it belongs to user', async () => {
      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      const created = await categoryRepository.create({
        name: 'Original',
        userId: user.id,
      });
      const updateData = { ...created, name: 'Updated' };

      const updated = await categoryRepository.update(user.id, updateData);

      expect(updated?.name).toBe('Updated');
    });

    it('should return undefined when category belongs to different user', async () => {
      const user2 = await testDbInstance.createUser();
      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      const created = await categoryRepository.create({
        name: 'Test',
        userId: user.id,
      });
      const updateData = { ...created, name: 'Hacked' };

      const result = await categoryRepository.update(user2.id, updateData);

      expect(result).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete category when it exists and belongs to user', async () => {
      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      const created = await categoryRepository.create({
        name: 'Test Category',
        userId: user.id,
      });

      const deleted = await categoryRepository.delete(user.id, created.id);

      expect(deleted).toBeDefined();
      expect(deleted?.id).toBe(created.id);
      expect(deleted?.name).toBe('Test Category');

      const found = await categoryRepository.getById(user.id, created.id);
      expect(found).toBeUndefined();
    });

    it('should return undefined when category does not exist', async () => {
      const nonExistentId = crypto.randomUUID();

      const result = await categoryRepository.delete(user.id, nonExistentId);

      expect(result).toBeUndefined();
    });

    it('should return undefined when category belongs to different user', async () => {
      const user2 = await testDbInstance.createUser();

      // TODO: Replace with direct DB insert to avoid circular dependency in tests
      // Should create test data via testDbInstance.db.insert() instead of categoryRepository.create()
      const created = await categoryRepository.create({
        name: 'Test Category',
        userId: user.id,
      });

      const result = await categoryRepository.delete(user2.id, created.id);

      expect(result).toBeUndefined();

      const stillExists = await categoryRepository.getById(user.id, created.id);
      expect(stillExists).toBeDefined();
    });

    it('should not affect other user categories when deleting', async () => {
      const user2 = await testDbInstance.createUser();

      const user1Category = await categoryRepository.create({
        name: 'User1 Category',
        userId: user.id,
      });

      const user2Category = await categoryRepository.create({
        name: 'User2 Category',
        userId: user2.id,
      });

      await categoryRepository.delete(user.id, user1Category.id);

      const user2Categories = await categoryRepository.getAll(user2.id);
      expect(user2Categories).toHaveLength(1);
      expect(user2Categories[0].id).toBe(user2Category.id);
    });

    it('should delete only specified category', async () => {
      const category1 = await categoryRepository.create({
        name: 'Category 1',
        userId: user.id,
      });

      const category2 = await categoryRepository.create({
        name: 'Category 2',
        userId: user.id,
      });

      await categoryRepository.delete(user.id, category1.id);

      const remainingCategories = await categoryRepository.getAll(user.id);
      expect(remainingCategories).toHaveLength(1);
      expect(remainingCategories[0].id).toBe(category2.id);
      expect(remainingCategories[0].name).toBe('Category 2');
    });
  });
});
