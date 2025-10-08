import { UUID } from '@ledgerly/shared/types';
import { AccountDbRow } from 'src/db/schema';
import { UsersRepository } from 'src/infrastructure/db/UsersRepository';
import { DataBase } from 'src/types';

import { AccountRepository } from '../../interfaces:toRefactor';

export class AccountUseCaseBase {
  constructor(
    protected readonly accountRepository: AccountRepository,
    protected readonly userRepository: UsersRepository,
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

  protected async ensureUserExists(userId: UUID, tx?: DataBase): Promise<void> {
    const user = await this.userRepository.getUserById(userId, tx);
    if (!user) {
      throw new Error('User not found');
    }
  }
}
