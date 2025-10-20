import { AccountResponseDTO, UUID } from '@ledgerly/shared/types';
import { Account } from 'src/domain/accounts/account.entity';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

import { AccountUseCaseBase } from './accountBase';

export class DeleteAccountUseCase extends AccountUseCaseBase {
  constructor(accountRepository: AccountRepositoryInterface) {
    super(accountRepository);
  }

  async execute(user: User, accountId: UUID): Promise<AccountResponseDTO> {
    const accountData = await this.ensureAccountExistsAndOwned(user, accountId);

    const account = Account.restore(accountData);

    account.markAsDeleted();

    return this.accountRepository.delete(user.id, accountId);
  }
}
