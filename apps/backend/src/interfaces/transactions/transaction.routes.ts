import type { FastifyInstance } from 'fastify';

export const transactionsRoutes = (app: FastifyInstance) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const transactionController = app.container.controllers.transaction;

  app.get('/:id', async (request, response) => {
    response.send({ user: request.user.toRecord() });
  });
};
