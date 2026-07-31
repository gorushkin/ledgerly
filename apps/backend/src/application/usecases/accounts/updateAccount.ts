import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import type {
  AccountRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { AccountOperationPolicy } from 'src/application/services';
import { Account } from 'src/domain/accounts';
import { ClosedAccountOperationError } from 'src/domain/domain.errors';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    private readonly accountOperationPolicy: AccountOperationPolicy,
    private readonly transactionManager: TransactionManagerInterface,
  ) {
    super(accountRepository);
  }

  private async checkAccountUpdateValidity(
    user: User,
    accountId: UUID,
    account: Account,
    data: AccountUpdateDTO,
  ): Promise<void> {
    if (account.closed && data.type !== undefined) {
      throw ClosedAccountOperationError.forUpdate(accountId);
    }

    if (data.type && data.type !== account.toSnapshot().type) {
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
    const accountSnapshot = await this.transactionManager.run(async () => {
      const accountData = await this.ensureAccountExistsAndOwned(
        user,
        accountId,
      );

      const account = Account.restore(accountData);
      await this.checkAccountUpdateValidity(user, accountId, account, data);

      account.update(AccountMapper.toUpdateProps(data));

      await this.accountRepository.update(
        user.getId().valueOf(),
        accountId,
        account.toSnapshot(),
      );

      return account.toSnapshot();
    });

    return AccountMapper.toResponseDTOFromSnapshot(accountSnapshot);
  }
}
