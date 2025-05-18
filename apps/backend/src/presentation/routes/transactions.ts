import type { FastifyInstance } from 'fastify';

export const registerTransactionsRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return { message: 'Transactions route is under construction.' };
  });
};
