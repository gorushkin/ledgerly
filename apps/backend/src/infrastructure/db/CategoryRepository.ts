import {
  CategoryCreate,
  CategoryResponse,
  CategoryUpdate,
  UUID,
} from '@ledgerly/shared/types';
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
            and(eq(categories.id, categoryId), eq(categories.userId, userId)),
          )
          .get(),
      'Failed to fetch category by ID',
    );
  }

  async getByName(
    userId: UUID,
    categoryName: string,
  ): Promise<CategoryResponse | undefined> {
    return this.executeDatabaseOperation<CategoryResponse | undefined>(
      () =>
        this.db
          .select()
          .from(categories)
          .where(
            and(
              eq(categories.name, categoryName),
              eq(categories.userId, userId),
            ),
          )
          .get(),
      'Failed to fetch category by name',
    );
  }

  update(
    userId: UUID,
    id: UUID,
    requestBody: CategoryUpdate,
  ): Promise<CategoryResponse | undefined> {
    return this.executeDatabaseOperation<CategoryResponse | undefined>(
      () => {
        return this.db
          .update(categories)
          .set({ name: requestBody.name })
          .where(and(eq(categories.id, id), eq(categories.userId, userId)))
          .returning()
          .get();
      },
      'Failed to update category',
      { field: 'name', tableName: 'categories', value: requestBody.name },
    );
  }

  async create(requestBody: CategoryCreate): Promise<CategoryResponse> {
    return this.executeDatabaseOperation<CategoryResponse>(
      async () =>
        this.db
          .insert(categories)
          .values({
            name: requestBody.name,
            userId: requestBody.userId,
          })
          .returning()
          .get(),
      'Failed to create category',
      { field: 'name', tableName: 'categories', value: requestBody.name },
    );
  }

  async delete(
    userId: UUID,
    categoryId: UUID,
  ): Promise<CategoryResponse | undefined> {
    return this.executeDatabaseOperation<CategoryResponse | undefined>(
      async () =>
        await this.db
          .delete(categories)
          .where(
            and(eq(categories.id, categoryId), eq(categories.userId, userId)),
          )
          .returning()
          .get(),
      'Failed to delete category',
    );
  }
}
