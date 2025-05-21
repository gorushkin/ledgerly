import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { registerAccountsRoutes } from './accounts';
import { registerEntriesRoutes } from './entries';
import { registerTransactionsRoutes } from './transactions';
import { registerUsersRoutes } from './users';
export { registerUsersRoutes } from './users';

export const registerRoutes = (fastify: FastifyInstance) => {
  fastify.get('/', (_request, reply) => {
    reply.send({ message: 'Welcome to the Money Manager API!' });
  });

  fastify.register(registerEntriesRoutes, { prefix: ROUTES.entries });
  fastify.register(registerTransactionsRoutes, { prefix: ROUTES.transactions });
  fastify.register(registerAccountsRoutes, { prefix: ROUTES.accounts });
  fastify.register(registerUsersRoutes, { prefix: ROUTES.users });
};
