import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

import { AccountUseCaseBase } from './accountUseCaseBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UsersRepository,
  ) {
    super(accountRepository, userRepository);
  }

  async execute(
    userId: UUID,
    accountId: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO> {
    await this.ensureUserExists(userId);

    const accountData = await this.ensureAccountExistsAndOwned(
      userId,
      accountId,
    );

    const account = Account.fromPersistence(accountData);

    account.updateAccount(data);

    return this.accountRepository.update(
      userId,
      accountId,
      account.toPersistence(),
    );
  }
}
