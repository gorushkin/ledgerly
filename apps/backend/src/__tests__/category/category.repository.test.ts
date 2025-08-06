import { UsersResponseDTO } from '@ledgerly/shared/types';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { RecordAlreadyExistsError } from 'src/presentation/errors';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
import { describe, beforeEach, it, expect } from 'vitest';

import { TestDB } from '../../db/test-db';

describe('CategoryRepository', () => {
  let testDB: TestDB;

  let categoryRepository: CategoryRepository;

  let user: UsersResponseDTO;

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();
    categoryRepository = new CategoryRepository(testDB.db);
    user = await testDB.createUser();
  });

  describe('getAll', () => {
    it('should return empty array when user has no categories', async () => {
      const categories = await categoryRepository.getAll(user.id);

      expect(categories).toEqual([]);
    });

    it('should return only user categories', async () => {
      const user2 = await testDB.createUser();

      await testDB.createCategory(user.id, {
        name: 'User1 Category',
      });

      await testDB.createCategory(user2.id, {
        name: 'User2 Category',
      });

      const user1Categories = await categoryRepository.getAll(user.id);

      expect(user1Categories).toHaveLength(1);
      expect(user1Categories[0].name).toBe('User1 Category');
    });

    it('should return multiple categories for user', async () => {
      await testDB.createCategory(user.id, {
        name: 'Food',
      });

      await testDB.createCategory(user.id, {
        name: 'Transport',
      });

      const categories = await categoryRepository.getAll(user.id);

      expect(categories).toHaveLength(2);
      expect(categories.map((c) => c.name)).toContain('Food');
      expect(categories.map((c) => c.name)).toContain('Transport');
    });
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
      const user2 = await testDB.createUser({
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
      const created = await testDB.createCategory(user.id);

      const found = await categoryRepository.getById(user.id, created.id);

      expect(found).toBeDefined();
      expect(found?.id).toBe(created.id);
    });

    it('should return undefined when category does not exist', async () => {
      const nonExistentId = crypto.randomUUID();

      const result = categoryRepository.getById(user.id, nonExistentId);
      await expect(result).rejects.toThrowError(NotFoundError);
    });

    it('should return undefined when category belongs to different user', async () => {
      const user2 = await testDB.createUser();
      const created = await testDB.createCategory(user.id);

      const result = categoryRepository.getById(user2.id, created.id);

      await expect(result).rejects.toThrowError(NotFoundError);
    });
  });

  describe('getByName', () => {
    it('should return category by name when exists and belongs to user', async () => {
      const created = await testDB.createCategory(user.id);

      const found = await categoryRepository.getByName(user.id, created.name);

      expect(found).toBeDefined();
      expect(found?.name).toBe(created.name);
    });

    it('should return undefined when category with given name does not exist', async () => {
      const result = categoryRepository.getByName(user.id, 'Nonexistent');

      await expect(result).rejects.toThrowError(NotFoundError);
    });

    it('should return undefined when category with name exists but belongs to another user', async () => {
      const user2 = await testDB.createUser();

      await testDB.createCategory(user2.id, {
        name: 'SharedName',
      });

      const result = categoryRepository.getByName(user.id, 'SharedName');

      await expect(result).rejects.toThrowError(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update category when it belongs to user', async () => {
      const created = await testDB.createCategory(user.id, {
        name: 'Original',
      });

      const updateData = { ...created, name: 'Updated' };

      const updated = await categoryRepository.update(
        user.id,
        created.id,
        updateData,
      );

      expect(updated?.name).toBe('Updated');
    });

    it('should return undefined when category belongs to different user', async () => {
      const user2 = await testDB.createUser();
      const created = await testDB.createCategory(user.id, {
        name: 'Test',
      });
      const updateData = { ...created, name: 'Hacked' };

      const result = categoryRepository.update(
        user2.id,
        created.id,
        updateData,
      );

      await expect(result).rejects.toThrowError(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete category when it exists and belongs to user', async () => {
      const created = await testDB.createCategory(user.id, {
        name: 'Test Category',
      });

      await categoryRepository.delete(user.id, created.id);

      const found = categoryRepository.getById(user.id, created.id);
      await expect(found).rejects.toThrowError(NotFoundError);
    });

    it('should return undefined when category does not exist', async () => {
      const nonExistentId = crypto.randomUUID();

      const result = categoryRepository.delete(user.id, nonExistentId);

      await expect(result).rejects.toThrowError(NotFoundError);
    });

    it('should return undefined when category belongs to different user', async () => {
      const user2 = await testDB.createUser();

      const created = await testDB.createCategory(user.id, {
        name: 'Test Category',
      });

      const result = categoryRepository.delete(user2.id, created.id);

      await expect(result).rejects.toThrowError(NotFoundError);

      const stillExists = await categoryRepository.getById(user.id, created.id);
      expect(stillExists).toBeDefined();
    });

    it('should not affect other user categories when deleting', async () => {
      const user2 = await testDB.createUser();

      const user1Category = await testDB.createCategory(user.id, {
        name: 'User1 Category',
      });

      const user2Category = await testDB.createCategory(user2.id, {
        name: 'User2 Category',
      });

      await categoryRepository.delete(user.id, user1Category.id);

      const user2Categories = await categoryRepository.getAll(user2.id);
      expect(user2Categories).toHaveLength(1);
      expect(user2Categories[0].id).toBe(user2Category.id);
    });

    it('should delete only specified category', async () => {
      const category1 = await testDB.createCategory(user.id, {
        name: 'Category 1',
      });

      const category2 = await testDB.createCategory(user.id, {
        name: 'Category 2',
      });

      await categoryRepository.delete(user.id, category1.id);

      const remainingCategories = await categoryRepository.getAll(user.id);
      expect(remainingCategories).toHaveLength(1);
      expect(remainingCategories[0].id).toBe(category2.id);
      expect(remainingCategories[0].name).toBe('Category 2');
    });
  });
});
