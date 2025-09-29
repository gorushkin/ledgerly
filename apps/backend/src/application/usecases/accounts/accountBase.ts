import { UUID } from '@ledgerly/shared/types';
import { AccountDbRow } from 'src/db/schema';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';

export class AccountBase {
  constructor(
    readonly accountRepository: AccountRepository,
    readonly userRepository: UsersRepository,
  ) {}

  async ensureAccountExistsAndOwned(
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

  async ensureUserExists(userId: UUID) {
    const user = await this.userRepository.getUserById(userId);

    if (!user) {
      throw new Error('User not found');
    }
  }
}
