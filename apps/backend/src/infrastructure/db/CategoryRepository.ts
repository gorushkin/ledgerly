import { CategoryResponseDTO } from '@ledgerly/shared/types';
import { categories } from 'src/db';
import { withErrorHandling } from 'src/libs/errorHandler';
import { DataBase } from 'src/types';

export class CategoryRepository {
  db: DataBase;
  constructor(db: DataBase) {
    this.db = db;
  }

  getAllCategories(): Promise<CategoryResponseDTO[]> {
    return withErrorHandling(
      () => this.db.select().from(categories).all(),
      'Failed to fetch categories',
    );
  }
}
