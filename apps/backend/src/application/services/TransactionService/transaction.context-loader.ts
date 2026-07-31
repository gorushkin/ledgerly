import { UUID } from '@ledgerly/shared/types';
import { Account, User } from 'src/domain';
import {
  ClosedAccountOperationError,
  DeletedEntityOperationError,
} from 'src/domain/domain.errors';
import { TransactionBuildContext } from 'src/domain/transactions/types';

import { OperationRequestDTO } from '../../dto';
import { AccountRepositoryInterface } from '../../interfaces';

export class TransactionContextLoader {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
  ) {}
  private async preloadAccounts(
    user: User,
    operations: OperationRequestDTO[],
  ): Promise<{
    accountsMap: Map<UUID, Account>;
  }> {
    const accountIds = new Set<UUID>();

    for (const operation of operations) {
      accountIds.add(operation.accountId);
    }

    const accountRows = await this.accountRepository.getByIds(
      user.getId().valueOf(),
      Array.from(accountIds),
    );

    const accountsMap = new Map<UUID, Account>();

    for (const snapshot of accountRows) {
      const account = Account.restore(snapshot);

      if (account.isDeleted()) {
        throw DeletedEntityOperationError.forUse(Account.entityType);
      }

      if (account.closed) {
        throw ClosedAccountOperationError.forUse(account.getId().valueOf());
      }

      accountsMap.set(snapshot.id, account);
    }

    return { accountsMap };
  }

  loadContext(
    user: User,
    operations: OperationRequestDTO[],
  ): Promise<TransactionBuildContext> {
    return this.preloadAccounts(user, operations);
  }
}
