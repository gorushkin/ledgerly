import { CategoryRepository } from 'src/infrastructure/db/CategoryRepository';

export class CategoryController {
  repo: CategoryRepository;

  constructor(repo: CategoryRepository) {
    this.repo = repo;
  }
  getAll() {
    return this.repo.getAllCategories();
  }
}
