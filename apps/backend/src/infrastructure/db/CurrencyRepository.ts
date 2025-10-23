import { CurrencyResponseDTO } from 'src/application';
import { DataBase } from 'src/db';
import { currenciesTable } from 'src/db/schema';

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
