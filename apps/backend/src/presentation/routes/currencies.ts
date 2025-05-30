import type { FastifyInstance } from 'fastify';
import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';

import { CurrencyController } from '../controllers/currency.controller';

export const registerCurrenciesRoutes = (app: FastifyInstance) => {
  const currencyRepo = new CurrencyRepository(app.db);
  const currencyController = new CurrencyController(currencyRepo);

  app.get('/', () => {
    return currencyController.getAll();
  });
};
