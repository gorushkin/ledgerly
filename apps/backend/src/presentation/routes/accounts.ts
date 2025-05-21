import type { FastifyInstance } from 'fastify';
import { accountInsertSchema } from 'src/db/schema';
import { uniqueIdSchema } from 'src/libs/validators';

import { accountController } from '../controllers/account.controller';

export const registerAccountsRoutes = (app: FastifyInstance) => {
  app.get('/', async () => {
    return await accountController.getAll();
  });

  app.get('/:id', async (request) => {
    const { id } = uniqueIdSchema.parse(request.params);

    return await accountController.getById(id);
  });

  app.post('/', async (request, reply) => {
    const newAccount = accountInsertSchema.parse(request.body);

    const createdAccount = await accountController.create(newAccount);
    reply.status(201).send(createdAccount);
  });

  app.delete('/:id', async (request, reply) => {
    const { id } = uniqueIdSchema.parse(request.params);

    await accountController.delete(id);

    reply.status(200).send({
      id,
      message: 'Account successfully deleted',
    });
  });

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
