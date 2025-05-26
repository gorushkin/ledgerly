import type { FastifyInstance } from 'fastify';
import { categoryRepository } from 'src/infrastructure/db/CategoryRepository';

export const registerCategoriesRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return categoryRepository.getAllCategories();
  });
};
