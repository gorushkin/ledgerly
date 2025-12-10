import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { EntryRepoInsert, EntryDbRow } from 'src/db/schemas/entries';
import { Account, Entry, Transaction, User } from 'src/domain';
import { Id } from 'src/domain/domain-core';

import { compareEntry, EntryCompareResult } from '../comparers';
import {
  CreateEntryRequestDTO,
  UpdateEntryRequestDTO,
  UpdateTransactionRequestDTO,
} from '../dto';
import {
  AccountRepositoryInterface,
  EntryRepositoryInterface,
  OperationRepositoryInterface,
} from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

import { AccountFactory } from './account.factory';
import { OperationFactory } from './operation.factory';

type CompareResult = { existing: Entry; incoming: UpdateEntryRequestDTO };

export class EntryFactory {
  constructor(
    protected readonly operationFactory: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly accountRepository: AccountRepositoryInterface,
    protected readonly accountFactory: AccountFactory,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
    protected readonly operationRepository: OperationRepositoryInterface,
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
    const createEntry = () =>
      Entry.create(user, transaction, entryData.description);

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

  private async voidEntries(user: User, entriesIds: UUID[]) {
    if (entriesIds.length === 0) {
      return;
    }

    await this.entryRepository.voidByIds(user.getId().valueOf(), entriesIds);
  }

  private async updateEntryMetadata(
    user: User,
    existing: Entry,
    incoming: UpdateEntryRequestDTO,
  ): Promise<Entry> {
    existing.updateDescription(incoming.description);

    const updatedEntryDto = await this.entryRepository.update(
      user.getId().valueOf(),
      existing.toPersistence(),
    );

    const entry = Entry.fromPersistence(updatedEntryDto);
    entry.addOperations(existing.getOperations());
    return entry;
  }

  private async updateEntriesMetadata(
    user: User,
    date: CompareResult[],
  ): Promise<Entry[]> {
    const promises = date.map(async ({ existing, incoming }) =>
      this.updateEntryMetadata(user, existing, incoming),
    );

    return Promise.all(promises);
  }

  private async updateEntriesFully(
    user: User,
    date: CompareResult[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    const updatedDataPromises = date.map(async ({ existing, incoming }) => {
      const updateEntryMetadata = this.updateEntryMetadata(
        user,
        existing,
        incoming,
      );

      return { existing: await updateEntryMetadata, incoming };
    });

    const updatedEntriesWithData = await Promise.all(updatedDataPromises);

    return this.updateEntriesFinancial(
      user,
      updatedEntriesWithData,
      accountsMap,
      systemAccountsMap,
    );
  }

  private async updateEntriesFinancial(
    user: User,
    date: CompareResult[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    const { existingEntriesIds } = date.reduce<{
      existingEntriesIds: UUID[];
      incoming: UpdateEntryRequestDTO[];
    }>(
      (acc, curr) => {
        acc.existingEntriesIds.push(curr.existing.getId().valueOf());
        acc.incoming.push(curr.incoming);
        return acc;
      },
      { existingEntriesIds: [], incoming: [] },
    );

    await this.operationRepository.voidByEntryIds(
      user.getId().valueOf(),
      existingEntriesIds,
    );

    const promises = date.map(async ({ existing, incoming }) => {
      const createdOperations =
        await this.operationFactory.createOperationsForEntry(
          user,
          existing,
          incoming,
          accountsMap,
          systemAccountsMap,
        );

      existing.updateOperations(createdOperations);

      return existing;
    });

    return Promise.all(promises);
  }

  private async updateEntries(
    user: User,
    transaction: Transaction,
    rawEntries: UpdateEntryRequestDTO[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    const entriesToBeMetadataUpdated: CompareResult[] = [];
    const entriesToBeFinancialUpdated: CompareResult[] = [];
    const entriesToBeFullyUpdated: CompareResult[] = [];
    const entriesToExclude: CompareResult[] = [];

    const map: Record<EntryCompareResult, CompareResult[]> = {
      unchanged: entriesToExclude,
      updatedBoth: entriesToBeFullyUpdated,
      updatedFinancial: entriesToBeFinancialUpdated,
      updatedMetadata: entriesToBeMetadataUpdated,
    };

    rawEntries.forEach((incoming) => {
      const existing = transaction.getEntryById(incoming.id);

      if (!existing) {
        // TODO: handle error
        return;
      }

      const compareResult = compareEntry(existing, incoming);

      const targetList = map[compareResult];

      targetList.push({ existing, incoming });
    });

    const updateMetadataPromises = await this.updateEntriesMetadata(
      user,
      entriesToBeMetadataUpdated,
    );

    const updateFinancialPromises = await this.updateEntriesFinancial(
      user,
      entriesToBeFinancialUpdated,
      accountsMap,
      systemAccountsMap,
    );

    const updatedEntriesPromises = await this.updateEntriesFully(
      user,
      entriesToBeFullyUpdated,
      accountsMap,
      systemAccountsMap,
    );

    return [
      ...updateMetadataPromises,
      ...updateFinancialPromises,
      ...updatedEntriesPromises,
    ];
  }

  async updateEntriesForTransaction({
    newEntriesData,
    transaction,
    user,
  }: {
    newEntriesData: UpdateTransactionRequestDTO['entries'];
    transaction: Transaction;
    user: User;
  }): Promise<Transaction> {
    const { accountsMap, currenciesSet } = await this.preloadAccounts(user, [
      ...newEntriesData.create,
      ...newEntriesData.update,
    ]);

    const systemAccountsMap = await this.preloadSystemAccounts(
      user,
      currenciesSet,
    );

    // TODO: it looks a bit weird, refactor later
    const { entryId, id } = transaction.getEntries().reduce(
      (acc, entry) => {
        if (newEntriesData.delete.includes(entry.getId().valueOf())) {
          const id = entry.getId();
          acc.id.push(id.valueOf());
          acc.entryId.push(id);
        }

        return acc;
      },
      { entryId: [], id: [] } as { id: UUID[]; entryId: Id[] },
    );

    await this.voidEntries(user, id);

    const createdEntriesPromises = newEntriesData.create.map(
      async (entryData) =>
        this.createEntryWithOperations(
          user,
          transaction,
          entryData,
          accountsMap,
          systemAccountsMap,
        ),
    );

    const createdEntries = await Promise.all(createdEntriesPromises);

    await this.updateEntries(
      user,
      transaction,
      newEntriesData.update,
      accountsMap,
      systemAccountsMap,
    );

    transaction.removeEntries(entryId);

    transaction.addEntries(createdEntries);

    transaction.validateEntriesBalance();
    return transaction;
  }
}
