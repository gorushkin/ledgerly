import { CategoryResponse } from '@ledgerly/shared/types';
import { categories } from 'src/db/schema';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class CategoryRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  getAllCategories(): Promise<CategoryResponse[]> {
    return this.executeDatabaseOperation<CategoryResponse[]>(
      () => this.db.select().from(categories).all(),
      'Failed to fetch categories',
    );
  }
}
