import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

import { accountController } from '../controllers/account.controller';

export const registerAccountTransactionsRoutes = (app: FastifyInstance) => {
  app.get('/:id/transactions', async (request) => {
    const { id } = uniqueIdSchema.parse(request.params);
    return await accountController.getTransactionsById(id);
  });

  app.post('/:id/transactions', async (request) => {
    const { id } = uniqueIdSchema.parse(request.params);
    const transaction = request.body;
    return await accountController.createTransaction(id, transaction);
  });
};
