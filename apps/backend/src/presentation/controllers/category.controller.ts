import { CategoryCreate, CategoryResponse } from '@ledgerly/shared/types';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@ledgerly/shared/validation';
import { CategoryService } from 'src/services/category.service';

export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  async getAll(): Promise<CategoryResponse[]> {
    return this.categoryService.getAll();
  }

  async getById(id: string): Promise<CategoryResponse | undefined> {
    return this.categoryService.getById(id);
  }

  async create(requestBody: CategoryCreate) {
    const categoryCreateDto = categoryCreateSchema.parse(requestBody);

    return this.categoryService.create(categoryCreateDto);
  }
  async update(id: string, requestBody: CategoryCreate) {
    const categoryUpdateDto = categoryUpdateSchema.parse({
      id,
      ...requestBody,
    });

    return this.categoryService.update(categoryUpdateDto);
  }
  async delete(id: string) {
    return this.categoryService.delete(id);
  }
}
