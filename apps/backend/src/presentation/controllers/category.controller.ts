import { CategoryResponse, UUID } from '@ledgerly/shared/types';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@ledgerly/shared/validation';
import { CategoryService } from 'src/services/category.service';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  async getAll(userId: UUID): Promise<CategoryResponse[]> {
    return this.categoryService.getAll(userId);
  }

  async getById(userId: UUID, id: UUID): Promise<CategoryResponse | undefined> {
    return this.categoryService.getById(userId, id);
  }

  async create(userId: UUID, requestBody: unknown) {
    const categoryCreateDto = categoryCreateSchema.parse({
      ...(typeof requestBody === 'object' && requestBody !== null
        ? requestBody
        : {}),
      userId,
    });

    return this.categoryService.create(categoryCreateDto);
  }
  async update(userId: UUID, id: UUID, requestBody: unknown) {
    const categoryUpdateDto = categoryUpdateSchema.parse({
      id,
      ...(typeof requestBody === 'object' && requestBody !== null
        ? requestBody
        : {}),
      userId,
    });

    return this.categoryService.update(categoryUpdateDto);
  }
  async delete(userId: UUID, id: string) {
    return this.categoryService.delete(userId, id);
  }
}
