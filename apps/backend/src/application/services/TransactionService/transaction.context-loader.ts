import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { Account, User } from 'src/domain';
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
    currenciesSet: Set<CurrencyCode>;
  }> {
    const accountIds = new Set<UUID>();
    const currenciesSet = new Set<CurrencyCode>();

    for (const operation of operations) {
      accountIds.add(operation.accountId);
    }

    const accountRows = await this.accountRepository.getByIds(
      user.getId().valueOf(),
      Array.from(accountIds),
    );

    const accountsMap = new Map<UUID, Account>();

    for (const row of accountRows) {
      currenciesSet.add(row.currency);
      accountsMap.set(row.id, Account.restore(row));
    }

    return { accountsMap, currenciesSet };
  }

  // TODO: return this method when system accounts are needed for some operation type (e.g. currency trading) and implement findOrCreateSystemAccount in AccountFactory
  // private async preloadSystemAccounts(
  //   user: User,
  //   currenciesSet: Set<CurrencyCode>,
  // ): Promise<Map<CurrencyCode, Account>> {
  //   const systemAccountsMap = new Map<CurrencyCode, Account>();

  //   for (const currency of currenciesSet) {
  //     const systemAccount = await this.accountFactory.findOrCreateSystemAccount(
  //       user,
  //       currency,
  //     );

  //     systemAccountsMap.set(currency, systemAccount);
  //   }

  //   return systemAccountsMap;
  // }

  async loadContext(
    user: User,
    operations: OperationRequestDTO[],
  ): Promise<TransactionBuildContext> {
    const { accountsMap } = await this.preloadAccounts(user, operations);

    // TODO: Return system account when it is needed for some operation type (e.g. currency trading) and implement findOrCreateSystemAccount in AccountFactory
    const systemAccountsMap = new Map<CurrencyCode, Account>();

    return { accountsMap, systemAccountsMap };
  }
}
