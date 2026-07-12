import {
  TransactionUpdateInput,
  type TransactionCreateInput,
} from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';

export const transactionsRoutes = (app: FastifyInstance) => {
  const transactionController = app.container.controllers.transaction;

  app.get('/:id', async (request, response) => {
    const transaction = await transactionController.getById(
      request.user,
      request.params,
    );

    response.send(transaction);
  });

  app.post<{ Body: TransactionCreateInput }>('/', async (request, response) => {
    const user = request.user;

    const transaction = await transactionController.create(user, request.body);
    response.status(201).send(transaction);
  });

  app.get('/', async (request, response) => {
    const user = request.user;

    const transactions = await transactionController.getAll(
      user,
      request.query,
    );

    response.send(transactions);
  });

  app.put<{ Body: TransactionUpdateInput; Params: { id: string } }>(
    '/:id',
    async (request, response) => {
      const user = request.user;

      const transaction = await transactionController.update(
        user,
        request.params,
        request.body,
      );

      response.send(transaction);
    },
  );

  app.delete('/:id', async (request, response) => {
    const user = request.user;

    await transactionController.delete(user, request.params);
    response.status(204).send();
  });
};
