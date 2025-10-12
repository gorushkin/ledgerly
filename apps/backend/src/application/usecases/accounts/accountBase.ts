import { UUID } from '@ledgerly/shared/types';
import { AccountDbRow } from 'src/db/schema';

import {
  AccountRepositoryInterface,
  UserRepositoryInterface,
} from '../../interfaces';

export class AccountUseCaseBase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly userRepository: UserRepositoryInterface,
  ) {}

  protected async ensureAccountExistsAndOwned(
    userId: UUID,
    accountId: UUID,
  ): Promise<AccountDbRow> {
    const account = await this.accountRepository.getById(userId, accountId);

    if (!account) {
      throw new Error('Account not found');
    }

    if (account.userId !== userId) {
      throw new Error('Account does not belong to user');
    }

    return account;
  }

  protected async ensureUserExists(userId: UUID): Promise<void> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
  }
}
