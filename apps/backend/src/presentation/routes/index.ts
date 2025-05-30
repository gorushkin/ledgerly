import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { registerCurrenciesRoutes } from './currencies';

export const registerRoutes = (fastify: FastifyInstance) => {
  fastify.get('/', (_request, reply) => {
    reply.send({ message: 'Welcome to the Money Manager API!' });
  });

  // fastify.register(registerTransactionsRoutes, { prefix: ROUTES.transactions });
  // fastify.register(registerAccountsRoutes, { prefix: ROUTES.accounts });
  // fastify.register(registerCategoriesRoutes, { prefix: ROUTES.categories });
  fastify.register(registerCurrenciesRoutes, { prefix: ROUTES.currencies });
};
