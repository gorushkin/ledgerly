import { Currency } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { currencies } from 'src/db/schema';
import { DataBase } from 'src/types';

import { BaseRepository } from './BaseRepository';

export class CurrencyRepository extends BaseRepository {
  constructor(db: DataBase) {
    super(db);
  }

  getAll(): Promise<Currency[]> {
    return this.executeDatabaseOperation(
      () => this.db.select().from(currencies).all(),
      'Failed to fetch currencies',
    );
  }

  getById(id: string): Promise<Currency | undefined> {
    return this.executeDatabaseOperation(
      () =>
        this.db.select().from(currencies).where(eq(currencies.code, id)).get(),
      `Failed to fetch currency with ID ${id}`,
    );
  }
}
