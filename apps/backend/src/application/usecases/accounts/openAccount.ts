import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { AccountMapper } from 'src/application/mappers';
import { Account } from 'src/domain/accounts/account.entity';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

import { AccountUseCaseBase } from './accountBase';

export class OpenAccountUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);
    const account = Account.restore(accountData);

    const result = account.open();

    if (result === 'unchanged') {
      return AccountMapper.toResponseDTOFromSnapshot(account.toSnapshot());
    }

    await this.accountRepository.open(
      user.getId().valueOf(),
      accountId,
      account.toSnapshot(),
    );

    return AccountMapper.toResponseDTOFromSnapshot(account.toSnapshot());
  }
}
