import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

export const registerCategoriesRoutes = (app: FastifyInstance) => {
  const categoryController = app.container.controllers.category;

  app.get('/', async (request) => {
    const userId = request.user.userId;

    return categoryController.getAll(userId);
  });

  app.get('/:id', async (request) => {
    const userId = request.user.userId;
    const { id } = uniqueIdSchema.parse(request.params);

    return categoryController.getById(userId, id);
  });

  app.post('/', async (request, reply) => {
    const userId = request.user.userId;
    const requestBody = request.body;

    const category = await categoryController.create(userId, requestBody);
    return reply.status(201).send(category);
  });

  app.put('/:id', async (request) => {
    const userId = request.user.userId;
    const { id } = uniqueIdSchema.parse(request.params);
    const requestBody = request.body;

    return categoryController.update(userId, id, requestBody);
  });

  app.delete('/:id', async (request, reply) => {
    const userId = request.user.userId;
    const { id } = uniqueIdSchema.parse(request.params);

    await categoryController.delete(userId, id);

    return reply.status(204).send();
  });
};
