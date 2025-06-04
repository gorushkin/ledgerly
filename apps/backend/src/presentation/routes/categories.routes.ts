import type { FastifyInstance } from 'fastify';

export const registerCategoriesRoutes = (app: FastifyInstance) => {
  const categoryController = app.container.controllers.category;

  app.get('/', () => {
    return categoryController.getAll();
  });
};
