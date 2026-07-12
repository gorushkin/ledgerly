import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { authMiddleware } from '../middleware';

import { accountsRoutes } from './accounts';
import { authRoutes } from './auth';
import { registerCurrenciesRoutes } from './currencies';
import { transactionsRoutes } from './transactions';
import { registerUserRoutes } from './users';

export const registerRoutes = (fastify: FastifyInstance) => {
  // Public routes
  fastify.get('/', (_request, reply) => {
    reply.send({ message: 'Welcome to the Money Manager API!' });
  });

  fastify.register(authRoutes, { prefix: ROUTES.auth });

  fastify.register(registerCurrenciesRoutes, {
    prefix: ROUTES.currencies,
  });

  // Protected routes
  fastify.register((protectedApp) => {
    protectedApp.addHook('onRequest', authMiddleware);

    protectedApp.register(transactionsRoutes, {
      prefix: ROUTES.transactions,
    });

    protectedApp.register(accountsRoutes, {
      prefix: ROUTES.accounts,
    });

    protectedApp.register(registerUserRoutes, {
      prefix: ROUTES.user,
    });
  });
};
