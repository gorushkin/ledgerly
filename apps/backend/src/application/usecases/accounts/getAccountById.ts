import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import {
  AccountRepositoryInterface,
  UserRepositoryInterface,
} from 'src/application/interfaces';
import { DataBase } from 'src/types';

import { AccountUseCaseBase } from './accountBase';

export class GetAccountByIdUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    userRepository: UserRepositoryInterface,
  ) {
    super(accountRepository, userRepository);
  }

  async execute(
    userId: UUID,
    id: UUID,
    _tx?: DataBase,
  ): Promise<AccountResponseDTO> {
    await this.ensureUserExists(userId);

    return this.ensureAccountExistsAndOwned(userId, id);
  }
}
