import { Account, AccountDTO } from '@ledgerly/backend/schema';
import { baseActions } from 'src/shared/api';

const URL = '/accounts';

export const accountActions = baseActions<Account, AccountDTO>(URL);
