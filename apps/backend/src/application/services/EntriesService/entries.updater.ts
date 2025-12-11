import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { Account, Entry, Transaction, User } from 'src/domain';
import { Id } from 'src/domain/domain-core';

import { compareEntry, EntryCompareResult } from '../../comparers';
import { UpdateEntryRequestDTO, UpdateTransactionRequestDTO } from '../../dto';
import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
} from '../../interfaces';
import { OperationFactory } from '../operation.factory';

import { EntryCreator } from './entries.creator';

type CompareResult = { existing: Entry; incoming: UpdateEntryRequestDTO };

type EntryContext = {
  accountsMap: Map<UUID, Account>;
  systemAccountsMap: Map<CurrencyCode, Account>;
};

export class EntryUpdater {
  constructor(
    protected readonly operationFactory: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly operationRepository: OperationRepositoryInterface,
    protected readonly entryCreator: EntryCreator,
  ) {}

  private async updateEntriesFinancial(
    user: User,
    entries: CompareResult[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    const { existingEntriesIds } = entries.reduce<{
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

    const promises = entries.map(async ({ existing, incoming }) => {
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
    entries: CompareResult[],
  ): Promise<Entry[]> {
    const promises = entries.map(async ({ existing, incoming }) =>
      this.updateEntryMetadata(user, existing, incoming),
    );

    return Promise.all(promises);
  }

  private async updateEntries(
    user: User,
    transaction: Transaction,
    rawEntries: UpdateEntryRequestDTO[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<void> {
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

    await Promise.all([
      ...updateMetadataPromises,
      ...updateFinancialPromises,
      ...updatedEntriesPromises,
    ]);
  }

  private async updateEntriesFully(
    user: User,
    entries: CompareResult[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    const updatedDataPromises = entries.map(async ({ existing, incoming }) => {
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

  private async voidEntries(user: User, entriesIds: UUID[]) {
    if (entriesIds.length === 0) {
      return;
    }

    await this.entryRepository.voidByIds(user.getId().valueOf(), entriesIds);
  }

  async execute({
    entryContext: { accountsMap, systemAccountsMap },
    newEntriesData,
    transaction,
    user,
  }: {
    newEntriesData: UpdateTransactionRequestDTO['entries'];
    transaction: Transaction;
    user: User;
    entryContext: EntryContext;
  }) {
    const { entryIds, ids } = transaction.getEntries().reduce(
      (acc, entry) => {
        if (newEntriesData.delete.includes(entry.getId().valueOf())) {
          const id = entry.getId();
          acc.ids.push(id.valueOf());
          acc.entryIds.push(id);
        }

        return acc;
      },
      { entryIds: [], ids: [] } as { ids: UUID[]; entryIds: Id[] },
    );

    await this.voidEntries(user, ids);

    const createdEntriesPromises = newEntriesData.create.map(
      async (entryData) =>
        this.entryCreator.createEntryWithOperations(
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

    transaction.removeEntries(entryIds);

    transaction.addEntries(createdEntries);

    transaction.validateEntriesBalance();

    return transaction;
  }
}
