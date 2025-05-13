import type { FastifyInstance } from 'fastify';
import { uniqueIdSchema } from 'src/libs/validators';

import { accountSchema } from '../../../../../packages/shared/types/account';
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
    const newAccount = accountSchema.parse(request.body);

    const createdAccount = await accountController.create(newAccount);
    reply.status(201).send(createdAccount);
  });
};
