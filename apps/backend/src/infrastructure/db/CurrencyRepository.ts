import { CurrencyResponseDTO } from 'src/application';
import { DataBase } from 'src/db';
import { currenciesTable } from 'src/db/schema';

import { BaseRepository } from './BaseRepository';
import { TransactionManager } from './TransactionManager';

export class CurrencyRepository extends BaseRepository {
  constructor(db: DataBase, transactionManager: TransactionManager) {
    super(db, transactionManager);
  }

  getAll(): Promise<CurrencyResponseDTO[]> {
    return this.executeDatabaseOperation(
      () => this.db.select().from(currenciesTable).all(),
      'Failed to fetch currencies',
    );
  }
}
