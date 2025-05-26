import { Currency } from '@ledgerly/shared/types';
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
}

export const currencyRepository = new CurrencyRepository();
