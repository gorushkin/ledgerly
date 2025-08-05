import {
  CategoryDBInsertDTO,
  CategoryDBRowDTO,
  CategoryDBUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { eq, and } from 'drizzle-orm';
import { categoriesTable } from 'src/db/schema';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class CategoryRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  async getAll(userId: UUID): Promise<CategoryDBRowDTO[]> {
    return this.executeDatabaseOperation<CategoryDBRowDTO[]>(
      async () =>
        this.db
          .select()
          .from(categoriesTable)
          .where(eq(categoriesTable.userId, userId))
          .all(),
      'Failed to fetch categories',
    );
  }

  async getById(
    userId: UUID,
    categoryId: UUID,
  ): Promise<CategoryDBRowDTO | undefined> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | undefined>(
      () =>
        this.db
          .select()
          .from(categoriesTable)
          .where(
            and(
              eq(categoriesTable.id, categoryId),
              eq(categoriesTable.userId, userId),
            ),
          )
          .get(),
      'Failed to fetch category by ID',
    );
  }

  async getByName(
    userId: UUID,
    categoryName: string,
  ): Promise<CategoryDBRowDTO | undefined> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | undefined>(
      () =>
        this.db
          .select()
          .from(categoriesTable)
          .where(
            and(
              eq(categoriesTable.name, categoryName),
              eq(categoriesTable.userId, userId),
            ),
          )
          .get(),
      'Failed to fetch category by name',
    );
  }

  update(
    userId: UUID,
    id: UUID,
    requestBody: CategoryDBUpdateDTO,
  ): Promise<CategoryDBRowDTO | undefined> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | undefined>(
      () => {
        return this.db
          .update(categoriesTable)
          .set({ name: requestBody.name })
          .where(
            and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)),
          )
          .returning()
          .get();
      },
      'Failed to update category',
      { field: 'name', tableName: 'categories', value: requestBody.name },
    );
  }

  async create(requestBody: CategoryDBInsertDTO): Promise<CategoryDBRowDTO> {
    return this.executeDatabaseOperation<CategoryDBRowDTO>(
      async () =>
        this.db
          .insert(categoriesTable)
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
  ): Promise<CategoryDBRowDTO | undefined> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | undefined>(
      async () =>
        await this.db
          .delete(categoriesTable)
          .where(
            and(
              eq(categoriesTable.id, categoryId),
              eq(categoriesTable.userId, userId),
            ),
          )
          .returning()
          .get(),
      'Failed to delete category',
    );
  }
}
