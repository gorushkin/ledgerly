import { CategoryCreate, CategoryResponse, UUID } from '@ledgerly/shared/types';
import { eq, and } from 'drizzle-orm';
import { categories } from 'src/db/schema';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class CategoryRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async getAll(userId: UUID): Promise<CategoryResponse[]> {
    return this.executeDatabaseOperation<CategoryResponse[]>(
      () =>
        this.db
          .select()
          .from(categories)
          .where(eq(categories.userId, userId))
          .all(),
      'Failed to fetch categories',
    );
  }

  async getById(
    userId: UUID,
    categoryId: UUID,
  ): Promise<CategoryResponse | undefined> {
    return this.executeDatabaseOperation<CategoryResponse | undefined>(
      () =>
        this.db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.id, categoryId),
              eq(categories.userId, userId), // ✅ Сразу фильтруем по владельцу
            ),
          )
          .get(),
      'Failed to fetch category by ID',
    );
  }

  update(
    _requestBody: CategoryResponse,
  ): Promise<CategoryResponse | undefined> {
    return this.executeDatabaseOperation<CategoryResponse | undefined>(() => {
      throw new Error('Method not implemented.');
    }, 'Failed to update category');
  }

  create(_requestBody: CategoryCreate): Promise<CategoryResponse> {
    return this.executeDatabaseOperation<CategoryResponse>(() => {
      throw new Error('Method not implemented.');
    }, 'Failed to create category');
  }

  delete(_userId: UUID, _categoryId: UUID): Promise<CategoryResponse> {
    return this.executeDatabaseOperation<CategoryResponse>(() => {
      throw new Error('Method not implemented.');
    }, 'Failed to delete category');
  }
}
