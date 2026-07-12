import {
  AccountResponseDTO,
  AccountUpdateDTO,
  UUID,
} from '@ledgerly/shared/types';
import type { AccountRepositoryInterface } from 'src/application/interfaces';
import { AccountMapper } from 'src/application/mappers';
import { Account } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

import { AccountUseCaseBase } from './accountBase';

export class UpdateAccountUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(
    user: User,
    accountId: UUID,
    data: AccountUpdateDTO,
  ): Promise<AccountResponseDTO> {
    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);

    const account = Account.restore(accountData);

    account.update(AccountMapper.toUpdateProps(data));

    const updatedAccount = await this.accountRepository.update(
      user.getId().valueOf(),
      accountId,
      account.toSnapshot(),
    );

    return AccountMapper.toResponseDTOFromSnapshot(updatedAccount);
  }
}
