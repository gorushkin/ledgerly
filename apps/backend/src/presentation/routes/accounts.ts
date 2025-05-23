import { accountCreateSchema } from '@ledgerly/shared/validation';
import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

import { accountController } from '../controllers/account.controller';

import { registerAccountTransactionsRoutes } from './accountTransactions';

export const registerAccountsRoutes = (app: FastifyInstance) => {
  app.get('/', async () => {
    return await accountController.getAll();
  });

  app.get('/:id', async (request) => {
    const { id } = uniqueIdSchema.parse(request.params);

    return await accountController.getById(id);
  });

  app.post('/', async (request, reply) => {
    const newAccount = accountCreateSchema.parse(request.body);

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

  registerAccountTransactionsRoutes(app);
};
