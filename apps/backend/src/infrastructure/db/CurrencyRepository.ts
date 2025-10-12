import { CurrencyResponseDTO } from 'src/application';
import { currenciesTable } from 'src/db/schema';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class CurrencyRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  getAll(): Promise<CurrencyResponseDTO[]> {
    return this.executeDatabaseOperation(
      () => this.db.select().from(currenciesTable).all(),
      'Failed to fetch currencies',
    );
  }
}
