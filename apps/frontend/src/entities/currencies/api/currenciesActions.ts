import { ROUTES } from '@ledgerly/shared/routes';
import { Currency } from '@ledgerly/shared/types';
import { baseActions } from 'src/shared/api';

const URL = ROUTES.currencies;

export const currencyActions = baseActions<Currency>(URL);
