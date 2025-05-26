import { currencyRepository } from 'src/infrastructure/db/CurrencyRepository';

export class CurrencyController {
  getAll() {
    return currencyRepository.getAllCurrencies();
  }
}

export const currencyController = new CurrencyController();
