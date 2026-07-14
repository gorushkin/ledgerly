import { UUID } from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { Account, AccountSnapshot } from 'src/domain/accounts';
import { User } from 'src/domain/users/user.entity';

import { AccountRepositoryInterface } from '../../interfaces';

export class AccountUseCaseBase {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
  ) {}

  protected async ensureAccountExistsAndOwned(
    user: User,
    accountId: UUID,
  ): Promise<AccountSnapshot> {
    const account = await this.accountRepository.getById(
      user.getId().valueOf(),
      accountId,
    );

    if (!account) {
      throw new EntityNotFoundError({
        entityId: accountId,
        entityType: Account.entityType,
      });
    }

    if (!user.verifyOwnership(account.userId)) {
      throw new UnauthorizedAccessError({
        entityId: accountId,
        entityType: Account.entityType,
      });
    }

    return account;
  }
}
