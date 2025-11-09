import { EntryRepoInsert, EntryDbRow } from 'src/db/schemas/entries';
import { Entry, Transaction, User } from 'src/domain';

import { CreateEntryRequestDTO } from '../dto';
import { EntryRepositoryInterface } from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

import { OperationFactory } from './operation.factory';

export class EntryFactory {
  constructor(
    protected readonly operationFactory: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}
  async createEntriesWithOperations(
    user: User,
    transaction: Transaction,
    rawEntries: CreateEntryRequestDTO[],
  ): Promise<Entry[]> {
    const createEntries = rawEntries.map(async (entryData) =>
      this.createEntryWithOperations(user, transaction, entryData),
    );

    return Promise.all(createEntries);
  }

  async createEntryWithOperations(
    user: User,
    transaction: Transaction,
    entryData: CreateEntryRequestDTO,
  ): Promise<Entry> {
    const createEntry = () => Entry.create(user, transaction);

    const entry = createEntry();

    await this.saveEntry(entry, createEntry);

    const operations = await this.operationFactory.createOperationsForEntry(
      user,
      entry,
      entryData,
    );

    entry.addOperations(operations);

    return entry;
  }

  private async saveEntry(entry: Entry, createEntry: () => Entry) {
    const result = await this.saveWithIdRetry<
      EntryRepoInsert,
      Entry,
      EntryDbRow
    >(
      entry,
      this.entryRepository.create.bind(this.entryRepository),
      createEntry,
    );

    return result;
  }
}
