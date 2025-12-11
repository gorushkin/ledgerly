import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { EntryRepoInsert, EntryDbRow } from 'src/db/schemas/entries';
import { Account, Entry, Transaction, User } from 'src/domain';

import { CreateEntryRequestDTO } from '../../dto';
import { EntryRepositoryInterface } from '../../interfaces';
import { SaveWithIdRetryType } from '../../shared/saveWithIdRetry';
import { OperationFactory } from '../operation.factory';

export class EntryCreator {
  constructor(
    protected readonly operationFactory: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}
  async createEntryWithOperations(
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
}
