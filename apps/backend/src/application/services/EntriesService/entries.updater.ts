import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { compareEntry, EntryCompareResult } from 'src/application/comparers';
import {
  UpdateEntryRequestDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
} from 'src/application/interfaces';
import { EntryCreator } from 'src/application/services/EntriesService';
import { OperationFactory } from 'src/application/services/operation.factory';
import { Account, Entry, Transaction, User } from 'src/domain';
import { Id } from 'src/domain/domain-core';

type CompareResult = { existing: Entry; incoming: UpdateEntryRequestDTO };

export type EntryContext = {
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
    entriesData: CompareResult[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    if (entriesData.length === 0) {
      return [];
    }

    const { existingEntriesIds } = entriesData.reduce<{
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

    const promises = entriesData.map(async ({ existing, incoming }) => {
      if (!incoming.operations) {
        return existing;
      }

      const createdOperations =
        await this.operationFactory.createOperationsForEntry(
          user,
          existing,
          incoming as Required<Pick<UpdateEntryRequestDTO, 'operations'>> &
            UpdateEntryRequestDTO,
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

    await this.entryRepository.update(
      user.getId().valueOf(),
      existing.toPersistence(),
    );

    return existing;
  }

  private async updateEntriesMetadata(
    user: User,
    entries: CompareResult[],
  ): Promise<Entry[]> {
    if (entries.length === 0) {
      return [];
    }

    const promises = entries.map(async ({ existing, incoming }) =>
      this.updateEntryMetadata(user, existing, incoming),
    );

    return Promise.all(promises);
  }

  private async updateEntriesFully(
    user: User,
    entriesData: CompareResult[],
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry[]> {
    if (entriesData.length === 0) {
      return [];
    }

    const updatedDataPromises = entriesData.map(
      async ({ existing, incoming }) => {
        const updateEntryMetadata = this.updateEntryMetadata(
          user,
          existing,
          incoming,
        );

        return { existing: await updateEntryMetadata, incoming };
      },
    );

    const updatedEntriesWithData = await Promise.all(updatedDataPromises);

    return this.updateEntriesFinancial(
      user,
      updatedEntriesWithData,
      accountsMap,
      systemAccountsMap,
    );
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

    await this.updateEntriesMetadata(user, entriesToBeMetadataUpdated);

    await this.updateEntriesFinancial(
      user,
      entriesToBeFinancialUpdated,
      accountsMap,
      systemAccountsMap,
    );

    await this.updateEntriesFully(
      user,
      entriesToBeFullyUpdated,
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
