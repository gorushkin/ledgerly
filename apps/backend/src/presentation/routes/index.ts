import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { registerAccountsRoutes } from './accounts';
import { authRoutes } from './auth.routes';
import { registerCategoriesRoutes } from './categories';
import { registerCurrenciesRoutes } from './currencies';
import { registerTransactionsRoutes } from './transactions';
import { registerUsersRoutes } from './users';

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
