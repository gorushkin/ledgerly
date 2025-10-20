import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';
import { User } from 'src/domain/users/user.entity';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';

import { AccountUseCaseBase } from './accountBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepository) {
    super(accountRepository);
  }

  async execute(
    user: User,
    accountId: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO> {
    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);

    const account = Account.restore(accountData);

    account.updateAccount(data);

    return this.accountRepository.update(
      user.id,
      accountId,
      account.toRecord(),
    );
  }
}
