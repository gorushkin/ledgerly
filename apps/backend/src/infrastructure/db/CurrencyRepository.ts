import { Currency } from '@ledgerly/shared/types';
import { eq } from 'drizzle-orm';
import { currencies } from 'src/db';
import { withErrorHandling } from 'src/libs/errorHandler';

import { BaseRepository } from './BaseRepository';

class CurrencyRepository extends BaseRepository {
  getAllCurrencies(): Promise<Currency[]> {
    return withErrorHandling(
      () => this.db.select().from(currencies).all(),
      'Failed to fetch currencies',
    );
  }

  getCurrencyById(id: string): Promise<Currency | undefined> {
    return withErrorHandling(
      () =>
        this.db.select().from(currencies).where(eq(currencies.code, id)).get(),
      `Failed to fetch currency with ID ${id}`,
    );
  }
}

export const currencyRepository = new CurrencyRepository();
