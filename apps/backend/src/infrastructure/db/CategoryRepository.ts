import {
  CategoryDBInsertDTO,
  CategoryDBRowDTO,
  CategoryDBUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { eq, and } from 'drizzle-orm';
import { categoriesTable } from 'src/db/schema';
import { NotFoundError } from 'src/presentation/errors/businessLogic.error';
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
  ): Promise<CategoryDBRowDTO | void> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | void>(async () => {
      const category = await this.db
        .select()
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.id, categoryId),
            eq(categoriesTable.userId, userId),
          ),
        )
        .get();

      if (!category) {
        throw new NotFoundError(`Category with ID ${categoryId} not found`);
      }

      return category;
    }, 'Failed to fetch category by ID');
  }

  async getByName(
    userId: UUID,
    categoryName: string,
  ): Promise<CategoryDBRowDTO | void> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | void>(async () => {
      const updatedCategory = await this.db
        .select()
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.name, categoryName),
            eq(categoriesTable.userId, userId),
          ),
        )
        .get();

      if (!updatedCategory) {
        throw new NotFoundError(`Category with name ${categoryName} not found`);
      }

      return updatedCategory;
    }, 'Failed to fetch category by name');
  }

  async existsByName(
    userId: UUID,
    categoryName: string,
  ): Promise<CategoryDBRowDTO | null> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | null>(async () => {
      const category = await this.db
        .select()
        .from(categoriesTable)
        .where(
          and(
            eq(categoriesTable.userId, userId),
            eq(categoriesTable.name, categoryName),
          ),
        )
        .get();

      return category ?? null;
    }, 'Failed to check category existence');
  }

  update(
    userId: UUID,
    id: UUID,
    requestBody: CategoryDBUpdateDTO,
  ): Promise<CategoryDBRowDTO | void> {
    return this.executeDatabaseOperation<CategoryDBRowDTO | void>(
      async () => {
        const category = await this.db
          .update(categoriesTable)
          .set({ name: requestBody.name })
          .where(
            and(eq(categoriesTable.id, id), eq(categoriesTable.userId, userId)),
          )
          .returning()
          .get();

        if (!category) {
          throw new NotFoundError(`Category with ID ${id} not found`);
        }

        return category;
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

  async delete(userId: UUID, categoryId: UUID): Promise<void> {
    return this.executeDatabaseOperation<void>(async () => {
      const { rowsAffected } = await this.db
        .delete(categoriesTable)
        .where(
          and(
            eq(categoriesTable.id, categoryId),
            eq(categoriesTable.userId, userId),
          ),
        )
        .run();

      if (rowsAffected === 0) {
        throw new NotFoundError(`Category with ID ${categoryId} not found`);
      }
    }, 'Failed to delete category');
  }
}
