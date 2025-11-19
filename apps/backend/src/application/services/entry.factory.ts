import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { EntryRepoInsert, EntryDbRow } from 'src/db/schemas/entries';
import { Account, Entry, Transaction, User } from 'src/domain';

import { CreateEntryRequestDTO } from '../dto';
import {
  AccountRepositoryInterface,
  EntryRepositoryInterface,
} from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

import { AccountFactory } from './account.factory';
import { OperationFactory } from './operation.factory';

export class EntryFactory {
  constructor(
    protected readonly operationFactory: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly accountFactory: AccountFactory,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async preloadAccounts(
    user: User,
    entries: CreateEntryRequestDTO[],
  ): Promise<{
    accountsMap: Map<UUID, Account>;
    currenciesSet: Set<CurrencyCode>;
  }> {
    const accountIds = new Set<UUID>();
    const currenciesSet = new Set<CurrencyCode>();

    for (const [from, to] of entries) {
      accountIds.add(from.accountId);
      accountIds.add(to.accountId);
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

  async preloadSystemAccounts(
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

  async createEntriesWithOperations(
    user: User,
    transaction: Transaction,
    rawEntries: CreateEntryRequestDTO[],
  ): Promise<Entry[]> {
    const { accountsMap, currenciesSet } = await this.preloadAccounts(
      user,
      rawEntries,
    );

    const systemAccountsMap = await this.preloadSystemAccounts(
      user,
      currenciesSet,
    );

    const createEntries = rawEntries.map(async (entryData) =>
      this.createEntryWithOperations(
        user,
        transaction,
        entryData,
        accountsMap,
        systemAccountsMap,
      ),
    );

    return Promise.all(createEntries);
  }

  private async createEntryWithOperations(
    user: User,
    transaction: Transaction,
    entryData: CreateEntryRequestDTO,
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry> {
    const createEntry = () => Entry.create(user, transaction);

    const entry = await this.saveEntry(createEntry);

    const operations = await this.operationFactory.createOperationsForEntry(
      user,
      entry,
      entryData,
      accountsMap,
      systemAccountsMap,
    );

    entry.addOperations(operations);

    return entry;
  }

  private saveEntry(createEntry: () => Entry) {
    return this.saveWithIdRetry<EntryRepoInsert, Entry, EntryDbRow>(
      this.entryRepository.create.bind(this.entryRepository),
      createEntry,
    );
  }
}
