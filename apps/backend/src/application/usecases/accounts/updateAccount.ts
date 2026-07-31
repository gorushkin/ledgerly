import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { AccountOperationPolicy } from 'src/application/services/';
import { Account, AccountSnapshot } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    private readonly accountOperationPolicy: AccountOperationPolicy,
  ) {
    super(accountRepository);
  }

  private async checkAccountUpdateValidity(
    user: User,
    accountId: UUID,
    accountData: AccountSnapshot,
    data: AccountUpdateDTO,
  ): Promise<void> {
    if (data.type && data.type !== accountData.type) {
      await this.accountOperationPolicy.assertNoActiveOperations(
        user.getId().valueOf(),
        accountId,
      );
    }
  }

  async execute(
    user: User,
    accountId: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO> {
    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);

    await this.checkAccountUpdateValidity(user, accountId, accountData, data);

    const account = Account.restore(accountData);

    account.update(AccountMapper.toUpdateProps(data));

    await this.accountRepository.update(
      user.getId().valueOf(),
      accountId,
      account.toSnapshot(),
    );

    return AccountMapper.toResponseDTOFromSnapshot(account.toSnapshot());
  }
}
