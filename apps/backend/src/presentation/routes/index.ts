import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { registerAccountsRoutes } from './accounts.routes';
import { authRoutes } from './auth.routes';
import { registerCategoriesRoutes } from './categories.routes';
import { registerCurrenciesRoutes } from './currencies.routes';
import { registerTransactionsRoutes } from './transactions.routes';
import { registerUsersRoutes } from './users.routes';

export const registerRoutes = (fastify: FastifyInstance) => {
  fastify.get('/', (_request, reply) => {
    reply.send({ message: 'Welcome to the Money Manager API!' });
  });

  fastify.register(authRoutes, { prefix: ROUTES.auth });
  fastify.register(registerTransactionsRoutes, { prefix: ROUTES.transactions });
  fastify.register(registerAccountsRoutes, { prefix: ROUTES.accounts });
  fastify.register(registerCategoriesRoutes, { prefix: ROUTES.categories });
  fastify.register(registerCurrenciesRoutes, { prefix: ROUTES.currencies });
  fastify.register(registerUsersRoutes, { prefix: ROUTES.users });
};
