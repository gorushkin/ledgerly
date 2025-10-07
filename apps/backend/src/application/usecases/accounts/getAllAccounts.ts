import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { AccountRepository } from 'src/application/interfaces:toRefactor';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

import { AccountBase } from './accountBase';

export class GetAllAccountsUseCase extends AccountBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UsersRepository,
  ) {
    super(accountRepository, userRepository);
  }

  async execute(userId: UUID): Promise<AccountResponseDTO[]> {
    await this.ensureUserExists(userId);

    return this.accountRepository.getAll(userId);
  }
}
