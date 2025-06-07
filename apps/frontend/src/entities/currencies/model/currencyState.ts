import { Currency } from '@ledgerly/shared/types';
import { runInAction } from 'mobx';

import { currencyActions } from '../api/currenciesActions';

class CurrencyState {
  currencies: Currency[] = [];

  getAll = async () => {
    const response = await currencyActions.read();

    runInAction(() => {
      if (response.ok) {
        this.currencies = response.data;
      } else {
        console.error(response.error);
      }
    });
  };
}

export const currencyState = new CurrencyState();
