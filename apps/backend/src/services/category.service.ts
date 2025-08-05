import {
  CategoryCreateDTO,
  CategoryResponseDTO,
  CategoryUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { RecordAlreadyExistsError } from 'src/presentation/errors';
import { CategoryNotFoundError } from 'src/presentation/errors/category.errors';

import { UserService } from './user.service';

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly userService: UserService,
  ) {}
  async getAll(userId: UUID): Promise<CategoryResponseDTO[]> {
    await this.userService.validateUser(userId);

    return this.categoryRepository.getAll(userId);
  }

  async validateAndGetCategory(
    userId: UUID,
    id: UUID,
  ): Promise<CategoryResponseDTO> {
    await this.userService.validateUser(userId);

    const category = await this.categoryRepository.getById(userId, id);

    if (!category) {
      throw new CategoryNotFoundError(
        `Category with id ${id} not found for user ${userId}`,
      );
    }

    return category;
  }

  async getByName(
    userId: UUID,
    name: string,
  ): Promise<CategoryResponseDTO | undefined> {
    return this.categoryRepository.getByName(userId, name);
  }

  async getById(
    userId: UUID,
    id: UUID,
  ): Promise<CategoryResponseDTO | undefined> {
    return this.validateAndGetCategory(userId, id);
  }

  async create(requestBody: CategoryCreateDTO): Promise<CategoryResponseDTO> {
    await this.userService.validateUser(requestBody.userId);

    const existingCategory = await this.categoryRepository.getByName(
      requestBody.userId,
      requestBody.name,
    );

    if (existingCategory) {
      throw new RecordAlreadyExistsError({
        context: {
          field: 'name',
          tableName: 'categories',
          value: existingCategory.name,
        },
      });
    }

    return this.categoryRepository.create(requestBody);
  }

  async update(
    userId: UUID,
    id: UUID,
    requestBody: CategoryUpdateDTO,
  ): Promise<CategoryResponseDTO | undefined> {
    await this.validateAndGetCategory(userId, id);

    const existingCategoryByName = await this.categoryRepository.getByName(
      userId,
      requestBody.name,
    );

    if (existingCategoryByName && existingCategoryByName.id !== id) {
      throw new RecordAlreadyExistsError({
        context: {
          field: 'name',
          tableName: 'categories',
          value: existingCategoryByName.name,
        },
      });
    }

    return this.categoryRepository.update(userId, id, requestBody);
  }

  async delete(
    userId: UUID,
    id: UUID,
  ): Promise<CategoryResponseDTO | undefined> {
    await this.validateAndGetCategory(userId, id);

    return this.categoryRepository.delete(userId, id);
  }
}
