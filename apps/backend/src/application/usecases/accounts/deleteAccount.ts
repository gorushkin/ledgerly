import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { AccountOperationPolicy } from 'src/application/services/';
import { Account } from 'src/domain/accounts/account.entity';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

import { AccountUseCaseBase } from './accountBase';

export class DeleteAccountUseCase extends AccountUseCaseBase {
  constructor(
    accountRepository: AccountRepositoryInterface,
    private readonly accountOperationPolicy: AccountOperationPolicy,
  ) {
    super(accountRepository);
  }

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    await this.accountOperationPolicy.assertNoActiveOperations(
      user.getId().valueOf(),
      accountId,
    );

    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);
    const account = Account.restore(accountData);

    const result = account.delete();

    if (result === 'unchanged') {
      return AccountMapper.toResponseDTOFromSnapshot(account.toSnapshot());
    }

    await this.accountRepository.delete(
      user.getId().valueOf(),
      accountId,
      account.toSnapshot(),
    );

    return AccountMapper.toResponseDTOFromSnapshot(account.toSnapshot());
  }
}
