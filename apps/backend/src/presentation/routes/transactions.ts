import { transactionCreateSchema } from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

import { transactionController } from '../controllers/transaction.controller';

export const registerTransactionsRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return transactionController.getAll();
  });

  app.get('/:id', (request) => {
    const { id } = uniqueIdSchema.parse(request.params);

    return transactionController.getById(id);
  });

  app.post('/', (request) => {
    const parsedTransactionDTO = transactionCreateSchema.parse(request.body);

    return transactionController.create(parsedTransactionDTO);
  });
};
