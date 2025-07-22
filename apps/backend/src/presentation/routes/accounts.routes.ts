import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

export const registerAccountsRoutes = (app: FastifyInstance) => {
  const accountController = app.container.controllers.account;

  app.get('/', async (request) => {
    const userId = request.user.userId;

    return await accountController.getAll(userId);
  });

  app.get('/:id', async (request) => {
    const { id } = uniqueIdSchema.parse(request.params);
    const userId = request.user.userId;

    return await accountController.getById(userId, id);
  });

  app.post('/', async (request, reply) => {
    const userId = request.user.userId;

    try {
      const account = await accountController.create(userId, request.body);
      reply.status(201).send(account);
    } catch (error) {
      reply.status(500).send({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
      });
    }
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = uniqueIdSchema.parse(request.params);

    await accountController.delete(id);

    reply.status(200).send({
      id,
      message: 'Account successfully deleted',
    });
  });
};
