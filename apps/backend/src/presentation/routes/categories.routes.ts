import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

export const registerCategoriesRoutes = (app: FastifyInstance) => {
  const categoryController = app.container.controllers.category;

  app.get('/', (request) => {
    const userId = request.user.userId;

    return categoryController.getAll(userId);
  });

  app.get('/:id', (request) => {
    const userId = request.user.userId;
    const { id } = uniqueIdSchema.parse(request.params);

    return categoryController.getById(userId, id);
  });

  app.post('/', (request) => {
    const userId = request.user.userId;
    const requestBody = request.body;

    return categoryController.create(userId, requestBody);
  });

  app.put('/:id', (request) => {
    const userId = request.user.userId;
    const { id } = uniqueIdSchema.parse(request.params);
    const requestBody = request.body;

    return categoryController.update(userId, id, requestBody);
  });

  app.delete('/:id', (request) => {
    const userId = request.user.userId;
    const { id } = uniqueIdSchema.parse(request.params);

    return categoryController.delete(userId, id);
  });
};
