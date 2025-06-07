import { ROUTES } from '@ledgerly/shared/routes';
import { AccountCreateDTO, AccountResponseDTO } from '@ledgerly/shared/types';
import { baseActions } from 'src/shared/api';

const URL = ROUTES.accounts;

export const accountActions = baseActions<AccountResponseDTO, AccountCreateDTO>(URL);
