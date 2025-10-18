import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { UserRepositoryInterface } from 'src/application/interfaces';
import { Account } from 'src/domain/accounts/account.entity';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';

import { AccountUseCaseBase } from './accountBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepository,
    userRepository: UserRepositoryInterface,
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

    const account = Account.restore(accountData);

    account.updateAccount(data);

    return this.accountRepository.update(userId, accountId, account.toRecord());
  }
}
