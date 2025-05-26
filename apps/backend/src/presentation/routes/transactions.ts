import { transactionCreateSchema } from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';

import { transactionController } from '../controllers/transaction.controller';

export const registerTransactionsRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return { message: 'Transactions route is under construction.' };
  });

  app.get('/:id', (request) => {
    const { id } = request.params as { id: string };

    return { message: `Transaction with ID ${id} is under construction.` };
  });

  app.post('/', (request) => {
    const newTransaction = transactionCreateSchema.parse(request.body);

    const createdTransaction = transactionController.create(newTransaction);
    return { message: createdTransaction };
  });
};
