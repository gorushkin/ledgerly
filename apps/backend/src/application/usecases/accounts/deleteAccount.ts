import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';

import {
  AccountRepositoryInterface,
  UserRepositoryInterface,
} from '../../interfaces';

import { AccountUseCaseBase } from './accountBase';

export class DeleteAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    userRepository: UserRepositoryInterface,
  ) {
    super(accountRepository, userRepository);
  }

  async execute(userId: UUID, accountId: UUID): Promise<AccountResponseDTO> {
    await this.ensureUserExists(userId);

    const accountData = await this.ensureAccountExistsAndOwned(
      userId,
      accountId,
    );

    const account = Account.fromPersistence(accountData);

    account.markAsDeleted();

    return this.accountRepository.delete(userId, accountId);
  }
}
