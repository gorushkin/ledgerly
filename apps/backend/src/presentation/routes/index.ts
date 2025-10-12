import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { authRoutes } from '../../interfaces/';
import { accountsRoutes } from '../../interfaces/';
import { authMiddleware } from '../middleware';

import { registerCurrenciesRoutes } from './currencies.routes';
import { registerTransactionsRoutes } from './transactions.routes';
import { registerUserRoutes } from './user.routes';

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

    protectedApp.register(registerTransactionsRoutes, {
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
