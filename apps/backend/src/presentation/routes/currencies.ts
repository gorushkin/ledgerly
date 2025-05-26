import type { FastifyInstance } from 'fastify';

import { currencyController } from '../controllers/currency.controller';

export const registerCurrenciesRoutes = (app: FastifyInstance) => {
  app.get('/', () => {
    return currencyController.getAll();
  });
};
