import type { FastifyInstance } from 'fastify';

export const registerCurrenciesRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    throw new Error('Not implemented');
  });
};
