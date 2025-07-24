import { CategoryCreate } from '@ledgerly/shared/types';
import { CategoryController } from 'src/presentation/controllers/category.controller';
import { CategoryService } from 'src/services/category.service';
import { it, expect, beforeEach, describe, vi } from 'vitest';
import { ZodError } from 'zod';

describe('CategoryController', () => {
  const mockCategoryService = {
    create: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    update: vi.fn(),
  };

  const userId = '0055a5ca-faf1-46f2-afbe-6d36b1544b75';
  const categoryId = '123e4567-e89b-12d3-a456-426614174000';

  const invalidDataCases = [
    ['empty name', { name: '' }],
    ['name as number', { name: 123, userId }],
    ['empty object', {}],
    ['null value', null],
    ['undefined value', undefined],
  ] as [string, CategoryCreate][];

  const categoryController = new CategoryController(
    mockCategoryService as unknown as CategoryService,
  );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return an array of categories', async () => {
    const categories = [
      { id: '1', name: 'Category 1' },
      { id: '2', name: 'Category 2' },
    ];

    mockCategoryService.getAll.mockResolvedValue(categories);

    const result = await categoryController.getAll(userId);

    expect(mockCategoryService.getAll).toHaveBeenCalled();
    expect(result).toEqual(categories);
  });

  it('should return a category by id', async () => {
    const category = { id: '1', name: 'Category 1' };
    mockCategoryService.getById.mockResolvedValue(category);

    const result = await categoryController.getById(userId, category.id);

    expect(mockCategoryService.getById).toHaveBeenCalledWith(
      userId,
      category.id,
    );
    expect(result).toEqual(category);
  });

  describe('Create', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create a new category with valid data', async () => {
      const newCategory = {
        name: 'New Category',
        userId,
      };

      const createdCategory = { id: '1', ...newCategory };

      mockCategoryService.create.mockResolvedValue(createdCategory);

      const result = await categoryController.create(userId, newCategory);

      expect(mockCategoryService.create).toHaveBeenCalledWith(newCategory);
      expect(result).toEqual(createdCategory);
    });

    it.each(invalidDataCases)(
      'should throw ZodError for %s',
      async (_, data) => {
        await expect(
          categoryController.create(data?.userId, data),
        ).rejects.toThrow(ZodError);
      },
    );
  });

  describe('update', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update an existing category with valid data', async () => {
      const category = {
        id: categoryId,
        name: 'Category',
        userId,
      };

      const updateData = {
        name: 'Updated Category Name',
        userId,
      };

      mockCategoryService.update.mockResolvedValue(updateData);

      const result = await categoryController.update(userId, category.id, {
        name: updateData.name,
      });

      expect(mockCategoryService.update).toHaveBeenCalledWith(
        userId,
        category.id,
        { name: updateData.name },
      );

      expect(result).toEqual(updateData);
    });

    it.each(invalidDataCases)(
      'should throw ZodError for %s',
      async (_, data) => {
        await expect(
          categoryController.update(data?.userId, categoryId, data),
        ).rejects.toThrow(ZodError);
      },
    );
  });

  describe('delete', () => {
    it('should delete a category successfully', async () => {
      const deletedCategory = { id: categoryId, name: 'Deleted Category' };

      mockCategoryService.delete.mockResolvedValue(deletedCategory);

      const result = await categoryController.delete(userId, categoryId);

      expect(mockCategoryService.delete).toHaveBeenCalledWith(
        userId,
        categoryId,
      );
      expect(result).toEqual(deletedCategory);
    });
  });
});
