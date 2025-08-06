import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { RecordAlreadyExistsError } from 'src/presentation/errors';
import { AuthErrors } from 'src/presentation/errors/auth.errors';
import { CategoryService } from 'src/services/category.service';
import { UserService } from 'src/services/user.service';
import { describe, vi, it, expect, beforeEach } from 'vitest';

describe('CategoryService', () => {
  const mockCategoryRepository = {
    create: vi.fn(),
    delete: vi.fn(),
    existsByName: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    getByName: vi.fn(),
    update: vi.fn(),
  };

  const userId = '0055a5ca-faf1-46f2-afbe-6d36b1544b75';

  const mockUserService = {
    validateUser: vi.fn(),
  };

  const service = new CategoryService(
    mockCategoryRepository as unknown as CategoryRepository,
    mockUserService as unknown as UserService,
  );

  describe('getAll', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return all categories for a user', async () => {
      const mockCategories = [
        { id: '1', name: 'Category 1' },
        { id: '2', name: 'Category 2' },
      ];

      mockCategoryRepository.getAll.mockResolvedValue(mockCategories);
      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });

      const result = await service.getAll(userId);

      expect(mockCategoryRepository.getAll).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockCategories);
    });

    it('should throw an error if user is not valid', async () => {
      mockUserService.validateUser.mockRejectedValue(
        new AuthErrors.UserNotFoundError(),
      );

      await expect(service.getAll(userId)).rejects.toThrowError(
        AuthErrors.UserNotFoundError,
      );
    });
  });

  describe('getById', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should return a category by id', async () => {
      const categoryId = '1';

      const mockCategory = { id: categoryId, name: 'Category 1' };

      mockCategoryRepository.getById.mockResolvedValue(mockCategory);
      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });

      const result = await service.getById(userId, categoryId);

      expect(mockCategoryRepository.getById).toHaveBeenCalledWith(
        userId,
        categoryId,
      );
      expect(result).toEqual(mockCategory);
    });

    it('should throw an error if category is not found', async () => {
      const categoryId = 'non-existent-id';

      mockCategoryRepository.getById.mockResolvedValue(undefined);
      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });

      await expect(service.getById(userId, categoryId)).rejects.toThrowError(
        `Category with id ${categoryId} not found for user ${userId}`,
      );
    });

    it('should throw an error if user is not valid', async () => {
      const categoryId = '1';

      mockUserService.validateUser.mockRejectedValue(
        new AuthErrors.UserNotFoundError(),
      );

      await expect(service.getById(userId, categoryId)).rejects.toThrowError(
        AuthErrors.UserNotFoundError,
      );
    });
  });

  describe('create', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should create a new category with valid data', async () => {
      const newCategory = {
        name: 'New Category',
        userId,
      };

      const createdCategory = { id: '1', ...newCategory };

      mockCategoryRepository.create.mockResolvedValue(createdCategory);
      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });

      mockCategoryRepository.existsByName.mockResolvedValue(null);

      const result = await service.create(newCategory);

      expect(mockCategoryRepository.create).toHaveBeenCalledWith(newCategory);
      expect(result).toEqual(createdCategory);
    });

    it('should throw an error if user is not valid', async () => {
      const newCategory = {
        name: 'New Category',
        userId: '0055a5ca-faf1-46f2-afbe-6d36b1544b75',
      };

      mockUserService.validateUser.mockRejectedValue(
        new AuthErrors.UserNotFoundError(),
      );

      await expect(service.create(newCategory)).rejects.toThrowError(
        AuthErrors.UserNotFoundError,
      );
    });
  });

  describe('update', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should update an existing category with valid data', async () => {
      const categoryId = '1';

      const updateData = {
        id: categoryId,
        name: 'Current Category Name',
        userId,
      };

      const updatedCategory = { ...updateData, name: 'Updated Category Name' };

      mockCategoryRepository.getById.mockResolvedValue(updatedCategory);
      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });

      await service.update(userId, categoryId, updateData);

      expect(mockCategoryRepository.update).toHaveBeenCalledWith(
        userId,
        categoryId,
        updateData,
      );

      expect(mockUserService.validateUser).toHaveBeenCalledWith(
        updateData.userId,
      );

      expect(mockCategoryRepository.getById).toHaveBeenCalledWith(
        updateData.userId,
        updateData.id,
      );
    });

    it('should throw an error if category is not found', async () => {
      const categoryId = 'non-existent-id';

      const updateData = {
        id: categoryId,
        name: 'Current Category Name',
        userId,
      };

      mockCategoryRepository.getById.mockResolvedValue(undefined);
      mockUserService.validateUser.mockResolvedValue(updateData);

      await expect(
        service.update(userId, categoryId, updateData),
      ).rejects.toThrowError(
        `Category with id ${categoryId} not found for user ${userId}`,
      );
    });

    it('should throw an error if user is not valid', async () => {
      const categoryId = '1';

      const updateData = {
        id: categoryId,
        name: 'Current Category Name',
        userId,
      };

      mockUserService.validateUser.mockRejectedValue(
        new AuthErrors.UserNotFoundError(),
      );

      await expect(
        service.update(userId, categoryId, updateData),
      ).rejects.toThrowError(AuthErrors.UserNotFoundError);
    });

    it('should throw an error if category name is not unique', async () => {
      const categoryId = '1';

      const existingCategory = {
        id: 'id',
        name: 'alreadyExistingName',
        userId,
      };

      const category = {
        id: categoryId,
        name: 'Current Category Name',
        userId,
      };

      const updateCategory = {
        id: categoryId,
        name: existingCategory.name,
        userId,
      };

      mockCategoryRepository.getById.mockResolvedValue(category);
      mockCategoryRepository.existsByName.mockResolvedValue(existingCategory);
      mockCategoryRepository.getByName.mockResolvedValue(existingCategory);
      mockUserService.validateUser.mockResolvedValue(true);

      await expect(
        service.update(userId, categoryId, updateCategory),
      ).rejects.toThrowError(RecordAlreadyExistsError);
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should delete a category by id', async () => {
      const categoryId = '1';

      const updateData = {
        id: categoryId,
        name: 'Current Category Name',
        userId,
      };

      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });
      mockCategoryRepository.delete.mockResolvedValue(updateData);
      mockCategoryRepository.getById.mockResolvedValue(updateData);

      const result = await service.delete(userId, categoryId);

      expect(mockCategoryRepository.delete).toHaveBeenCalledWith(
        userId,
        categoryId,
      );

      expect(result).toEqual(updateData);
    });

    it('should throw an error if user is not valid', async () => {
      const categoryId = '1';

      mockUserService.validateUser.mockRejectedValue(
        new AuthErrors.UserNotFoundError(),
      );

      await expect(service.delete(userId, categoryId)).rejects.toThrowError(
        AuthErrors.UserNotFoundError,
      );
    });

    it('should throw an error if category is not found', async () => {
      const categoryId = 'non-existent-id';

      mockUserService.validateUser.mockResolvedValue({
        email: 'test@test.com',
        id: userId,
      });

      mockCategoryRepository.getById.mockResolvedValue(undefined);

      await expect(service.delete(userId, categoryId)).rejects.toThrowError(
        `Category with id ${categoryId} not found`,
      );
    });
  });
});
