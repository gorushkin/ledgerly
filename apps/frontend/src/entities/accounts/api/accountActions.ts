import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { baseActions } from 'src/shared/api';

const URL = '/accounts';

export const accountActions = baseActions<AccountResponseDTO, AccountCreateDTO>(URL);
