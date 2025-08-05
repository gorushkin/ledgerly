import { CategoryResponseDTO, UUID } from '@ledgerly/shared/types';
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

  async getAll(userId: UUID): Promise<CategoryResponseDTO[]> {
    return this.categoryService.getAll(userId);
  }

  async getById(
    userId: UUID,
    id: UUID,
  ): Promise<CategoryResponseDTO | undefined> {
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
    const categoryUpdateDto = categoryUpdateSchema.parse(requestBody);

    return this.categoryService.update(userId, id, categoryUpdateDto);
  }
  async delete(userId: UUID, id: UUID) {
    return this.categoryService.delete(userId, id);
  }
}
