import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { Account, User } from 'src/domain';

import { CreateEntryRequestDTO, UpdateEntryRequestDTO } from '../../dto';
import { AccountRepositoryInterface } from '../../interfaces';
import { AccountFactory } from '../account.factory';

type EntryContext = {
  accountsMap: Map<UUID, Account>;
  systemAccountsMap: Map<CurrencyCode, Account>;
};

export class EntriesContextLoader {
  constructor(
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly accountFactory: AccountFactory,
  ) {}
  private async preloadAccounts(
    user: User,
    entries: CreateEntryRequestDTO[],
  ): Promise<{
    accountsMap: Map<UUID, Account>;
    currenciesSet: Set<CurrencyCode>;
  }> {
    const accountIds = new Set<UUID>();
    const currenciesSet = new Set<CurrencyCode>();

    for (const entry of entries) {
      for (const operation of entry.operations) {
        accountIds.add(operation.accountId);
      }
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

  private async preloadSystemAccounts(
    user: User,
    currenciesSet: Set<CurrencyCode>,
  ): Promise<Map<CurrencyCode, Account>> {
    const systemAccountsMap = new Map<CurrencyCode, Account>();

    for (const currency of currenciesSet) {
      const systemAccount = await this.accountFactory.findOrCreateSystemAccount(
        user,
        currency,
      );

      systemAccountsMap.set(currency, systemAccount);
    }

    return systemAccountsMap;
  }

  async loadForEntries(
    user: User,
    rawEntries: (CreateEntryRequestDTO | UpdateEntryRequestDTO)[],
  ): Promise<EntryContext> {
    const { accountsMap, currenciesSet } = await this.preloadAccounts(
      user,
      rawEntries,
    );

    const systemAccountsMap = await this.preloadSystemAccounts(
      user,
      currenciesSet,
    );

    return { accountsMap, systemAccountsMap };
  }
}
