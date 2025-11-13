import { TransactionQueryParams } from '@ledgerly/shared/types';
import {
  getTransactionsQuerySchema,
  uniqueIdSchema,
  type TransactionCreateInput,
} from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';

export const transactionsRoutes = (app: FastifyInstance) => {
  const transactionController = app.container.controllers.transaction;

  app.get('/:id', async (request, response) => {
    const { id } = uniqueIdSchema.parse(request.params);

    const transaction = await transactionController.getById(request.user, id);

    response.send(transaction);
  });

  app.post<{ Body: TransactionCreateInput }>('/', async (request, response) => {
    const user = request.user;

    const transaction = await transactionController.create(user, request.body);
    response.status(201).send(transaction);
  });

  app.get<{ Querystring: TransactionQueryParams }>(
    '/',
    async (request, response) => {
      const user = request.user;

      const query = getTransactionsQuerySchema.parse(request.query);

      const transactions = await transactionController.getAll(user, query);

      response.send(transactions);
    },
  );
};
