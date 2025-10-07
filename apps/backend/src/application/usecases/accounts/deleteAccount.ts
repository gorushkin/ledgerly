import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

import { AccountRepository } from '../../interfaces:toRefactor';

import { AccountBase } from './accountBase';

export class DeleteAccountUseCase extends AccountBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UsersRepository,
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
