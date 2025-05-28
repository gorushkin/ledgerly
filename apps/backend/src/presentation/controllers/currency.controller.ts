import { currencyRepository } from 'src/infrastructure/db/CurrencyRepository';

export class CurrencyController {
  getAll() {
    return currencyRepository.getAllCurrencies();
  }

  getById(id: string) {
    return currencyRepository.getCurrencyById(id);
  }
}

export const currencyController = new CurrencyController();
