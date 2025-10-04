import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { DataBase } from 'src/types';

import { AccountBase } from './accountBase';

export class GetAccountByIdUseCase extends AccountBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UsersRepository,
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
