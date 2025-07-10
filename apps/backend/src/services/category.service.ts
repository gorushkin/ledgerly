import {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
  UUID,
} from '@ledgerly/shared/types';
import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';
import { CategoryNotFoundError } from 'src/presentation/errors/category.errors';

import { UserService } from './user.service';

export class CategoryService {
  constructor(
    private readonly categoryRepository: CategoryRepository,
    private readonly userService: UserService,
  ) {}
  async getAll(userId: UUID): Promise<CategoryResponse[]> {
    await this.userService.validateUser(userId);

    return this.categoryRepository.getAll(userId);
  }

  async validateAndGetCategory(
    userId: UUID,
    id: UUID,
  ): Promise<CategoryResponse> {
    await this.userService.validateUser(userId);

    const category = await this.categoryRepository.getById(userId, id);

    if (!category) {
      throw new CategoryNotFoundError(
        `Category with id ${id} not found for user ${userId}`,
      );
    }

    return category;
  }

  async getById(userId: UUID, id: UUID): Promise<CategoryResponse | undefined> {
    return this.validateAndGetCategory(userId, id);
  }

  async create(requestBody: CategoryCreate): Promise<CategoryResponse> {
    await this.userService.validateUser(requestBody.userId);

    return this.categoryRepository.create(requestBody);
  }

  async update(
    requestBody: CategoryUpdate,
  ): Promise<CategoryResponse | undefined> {
    await this.validateAndGetCategory(requestBody.userId, requestBody.id);

    return this.categoryRepository.update(requestBody.userId, requestBody);
  }

  async delete(userId: UUID, id: UUID): Promise<CategoryResponse | undefined> {
    await this.validateAndGetCategory(userId, id);

    return this.categoryRepository.delete(userId, id);
  }
}
