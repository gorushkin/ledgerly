import type { FastifyInstance } from 'fastify';

export const registerCurrenciesRoutes = (app: FastifyInstance) => {
  const currencyController = app.container.controllers.currency;

  app.get('/', () => {
    return currencyController.getAll();
  });
};
