import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

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

    account.markAsArchived();

    return this.accountRepository.delete(userId, accountId);
  }
}
