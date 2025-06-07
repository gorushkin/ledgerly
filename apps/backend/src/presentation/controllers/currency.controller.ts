import { CurrencyRepository } from 'src/infrastructure/db/CurrencyRepository';

export class CurrencyController {
  repo: CurrencyRepository;

  constructor(repo: CurrencyRepository) {
    this.repo = repo;
  }
  getAll() {
    return this.repo.getAllCurrencies();
  }

  getById(id: string) {
    return this.repo.getCurrencyById(id);
  }
}
