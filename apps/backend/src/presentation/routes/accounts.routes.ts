import type { FastifyInstance } from 'fastify';
import { validators } from 'src/libs/';

export const registerAccountsRoutes = (app: FastifyInstance) => {
  const accountController = app.container.controllers.account;

  app.get('/', async (request) => {
    const userId = request.user.userId;

    return await accountController.getAll(userId);
  });

  app.get('/:id', async (request) => {
    const { id } = validators.uniqueIdSchema.parse(request.params);
    const userId = request.user.userId;

    return accountController.getById(userId, id);
  });

  app.post('/', async (request, reply) => {
    const userId = request.user.userId;

    const account = await accountController.create(userId, request.body);
    reply.status(201).send(account);
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = validators.uniqueIdSchema.parse(request.params);
    const userId = request.user.userId;

    await accountController.delete(userId, id);

    reply.status(204).send();
  });

  app.put('/:id', async (request, reply) => {
    const { id } = validators.uniqueIdSchema.parse(request.params);
    const userId = request.user.userId;

    const updatedAccount = await accountController.update(
      userId,
      id,
      request.body,
    );
    reply.status(200).send(updatedAccount);
  });
};
