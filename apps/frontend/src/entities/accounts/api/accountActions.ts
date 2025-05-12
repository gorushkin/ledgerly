import { Account, AccountFormValues } from 'shared/types/account';
import { baseActions } from 'src/shared/api';

const URL = '/accounts';

export const accountActions = baseActions<Account, AccountFormValues>(URL);
