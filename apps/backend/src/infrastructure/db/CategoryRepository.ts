import { CategoryResponseDTO } from '@ledgerly/shared/types';
import { categories } from 'src/db';
import { withErrorHandling } from 'src/libs/errorHandler';

import { BaseRepository } from './BaseRepository';

class CategoryRepository extends BaseRepository {
  getAllCategories(): Promise<CategoryResponseDTO[]> {
    return withErrorHandling(
      () => this.db.select().from(categories).all(),
      'Failed to fetch categories',
    );
  }
}

export const categoryRepository = new CategoryRepository();
