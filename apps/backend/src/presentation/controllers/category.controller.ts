import { CategoryResponse, UUID } from '@ledgerly/shared/types';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@ledgerly/shared/validation';
import { CategoryService } from 'src/services/category.service';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  private getNonNullObject(requestBody: unknown): object {
    return typeof requestBody === 'object' && requestBody !== null
      ? requestBody
      : {};
  }

  async getAll(userId: UUID): Promise<CategoryResponse[]> {
    return this.categoryService.getAll(userId);
  }

  async getById(userId: UUID, id: UUID): Promise<CategoryResponse | undefined> {
    return this.categoryService.getById(userId, id);
  }

  async create(userId: UUID, requestBody: unknown) {
    const categoryCreateDto = categoryCreateSchema.parse({
      ...this.getNonNullObject(requestBody),
      userId,
    });

    return this.categoryService.create(categoryCreateDto);
  }
  async update(userId: UUID, id: UUID, requestBody: unknown) {
    const categoryUpdateDto = categoryUpdateSchema.parse({
      id,
      ...this.getNonNullObject(requestBody),
      userId,
    });

    return this.categoryService.update(categoryUpdateDto);
  }
  async delete(userId: UUID, id: UUID) {
    return this.categoryService.delete(userId, id);
  }
}
