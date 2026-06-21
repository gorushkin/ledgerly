import { UUID } from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { AccountDbRow } from 'src/db/schema';
import { Account } from 'src/domain/accounts/account.entity';
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
