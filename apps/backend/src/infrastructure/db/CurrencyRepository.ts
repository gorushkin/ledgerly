import { CurrencyResponseDTO } from 'src/application';
import { currenciesTable } from 'src/db/schema';

import { BaseRepository } from './BaseRepository';

export class CurrencyRepository extends BaseRepository {
  getAll(): Promise<CurrencyResponseDTO[]> {
    return this.executeDatabaseOperation(
      () => this.db.select().from(currenciesTable).all(),
      'Failed to fetch currencies',
    );
  }
}
