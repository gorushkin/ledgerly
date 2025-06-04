import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { authMiddleware } from '../middleware';

import { registerAccountsRoutes } from './accounts.routes';
import { authRoutes } from './auth.routes';
import { registerCategoriesRoutes } from './categories.routes';
import { registerCurrenciesRoutes } from './currencies.routes';
import { registerProfileRoutes } from './profile.routes';
import { registerTransactionsRoutes } from './transactions.routes';

export const registerRoutes = (fastify: FastifyInstance) => {
  // Public routes
  fastify.get('/', (_request, reply) => {
    reply.send({ message: 'Welcome to the Money Manager API!' });
  });

  fastify.register(authRoutes, { prefix: ROUTES.auth });

  // Protected routes
  fastify.register((protectedApp) => {
    protectedApp.addHook('onRequest', authMiddleware);

    protectedApp.register(registerTransactionsRoutes, {
      prefix: ROUTES.transactions,
    });

    protectedApp.register(registerAccountsRoutes, {
      prefix: ROUTES.accounts,
    });

    protectedApp.register(registerCategoriesRoutes, {
      prefix: ROUTES.categories,
    });

    protectedApp.register(registerCurrenciesRoutes, {
      prefix: ROUTES.currencies,
    });

    protectedApp.register(registerProfileRoutes, {
      prefix: ROUTES.profile,
    });
  });
};
