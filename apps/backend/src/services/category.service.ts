import {
  CategoryResponse,
  CategoryCreate,
  CategoryUpdate,
} from '@ledgerly/shared/types';

export class CategoryService {
  getAll(): Promise<CategoryResponse[]> {
    throw new Error('Method not implemented.');
  }

  getById(_id: string): Promise<CategoryResponse | undefined> {
    throw new Error('Method not implemented.');
  }

  create(_requestBody: CategoryCreate): Promise<CategoryResponse> {
    throw new Error('Method not implemented.');
  }

  update(_requestBody: CategoryUpdate): Promise<CategoryResponse | undefined> {
    throw new Error('Method not implemented.');
  }

  delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
