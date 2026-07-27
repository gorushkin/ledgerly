import type { FastifyInstance } from 'fastify';

export const accountsRoutes = (app: FastifyInstance) => {
  const accountController = app.container.controllers.account;

  app.get('/', async (request) => {
    const user = request.user;

    return await accountController.getAll(user);
  });

  app.get('/:id', async (request) => {
    const user = request.user;

    return accountController.getById(user, request.params);
  });

  app.post('/', async (request, reply) => {
    const user = request.user;

    const account = await accountController.create(user, request.body);
    reply.status(201).send(account);
  });

  app.delete('/:id', async (request, reply) => {
    const user = request.user;

    await accountController.deleteAccount(user, request.params);

    reply.status(204).send();
  });

  app.patch('/:id', async (request, reply) => {
    const user = request.user;

    const updatedAccount = await accountController.update(
      user,
      request.params,
      request.body,
    );
    reply.status(200).send(updatedAccount);
  });
};
