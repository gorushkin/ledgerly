import { UUID } from '@ledgerly/shared/types';
import { AccountDbRow } from 'src/db/schema';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

export class AccountUseCaseBase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
  ) {}

  protected async ensureAccountExistsAndOwned(
    user: User,
    accountId: UUID,
  ): Promise<AccountDbRow> {
    const account = await this.accountRepository.getById(user.id, accountId);

    if (!account) {
      throw new Error('Account not found');
    }

    if (!user.verifyOwnership(account.userId)) {
      throw new Error('Account does not belong to user');
    }

    return account;
  }
}
