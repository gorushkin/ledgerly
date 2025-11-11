import {
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

  app.post<{ Body: TransactionCreateInput }>('/', async (request, reply) => {
    const user = request.user;

    const transaction = await transactionController.create(user, request.body);
    reply.status(201).send(transaction);
  });
};
