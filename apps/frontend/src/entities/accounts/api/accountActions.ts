import type { Account, AccountDTO } from '@ledgerly/shared';
import { baseActions } from 'src/shared/api';

const URL = '/accounts';

export const accountActions = baseActions<Account, AccountDTO>(URL);
