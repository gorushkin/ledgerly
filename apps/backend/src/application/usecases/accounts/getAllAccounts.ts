import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import {
  AccountRepositoryInterface,
  UserRepositoryInterface,
} from 'src/application/interfaces';

import { AccountUseCaseBase } from './accountBase';

export class GetAllAccountsUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    userRepository: UserRepositoryInterface,
  ) {
    super(accountRepository, userRepository);
  }

  async execute(userId: UUID): Promise<AccountResponseDTO[]> {
    await this.ensureUserExists(userId);

    return this.accountRepository.getAll(userId);
  }
}
