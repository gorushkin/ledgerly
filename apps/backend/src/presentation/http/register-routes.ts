import { ROUTES } from '@ledgerly/shared/routes';
import type { FastifyInstance } from 'fastify';

import { accountsRoutes } from './accounts';
import { authRoutes } from './auth';
import { commodityRoutes } from './commodities';
import { authMiddleware } from './middleware';
import { transactionsRoutes } from './transactions';
import { registerUserRoutes } from './users';

export const registerRoutes = (fastify: FastifyInstance) => {
  // Public routes
  fastify.get('/', (_request, reply) => {
    reply.send({ message: 'Welcome to the Money Manager API!' });
  });

  fastify.register(authRoutes, { prefix: ROUTES.app.auth.root });

  // Protected routes
  fastify.register((protectedApp) => {
    protectedApp.addHook('onRequest', authMiddleware);

    protectedApp.register(transactionsRoutes, {
      prefix: ROUTES.app.transactions,
    });

    protectedApp.register(accountsRoutes, {
      prefix: ROUTES.app.accounts,
    });

    protectedApp.register(registerUserRoutes, {
      prefix: ROUTES.app.user.root,
    });

    protectedApp.register(commodityRoutes, {
      prefix: ROUTES.app.commodities,
    });
  });
};
