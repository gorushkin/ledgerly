import { EntryRepoInsert, EntryDbRow } from 'src/db/schemas/entries';
import { Entry, Transaction, User } from 'src/domain';

import { CreateEntryRequestDTO } from '../dto';
import { EntryRepositoryInterface } from '../interfaces';
import { SaveWithIdRetryType } from '../shared/saveWithIdRetry';

import { OperationFactory } from './operation.factory';

export class EntryFactory {
  constructor(
    protected readonly createOperationService: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}
  async createEntriesWithOperations(
    user: User,
    transaction: Transaction,
    rawEntries: CreateEntryRequestDTO[],
  ): Promise<Entry[]> {
    const createEntries = rawEntries.map(async (entryData) => {
      const createEntry = this.createEntry(user, transaction);

      const entry = createEntry();

      await this.saveEntry(entry, createEntry);

      const operations =
        await this.createOperationService.createOperationsForEntry(
          user,
          entry,
          entryData.operations,
        );

      entry.addOperations(operations);

      return entry;
    });

    return Promise.all(createEntries);
  }
  private createEntry(user: User, transaction: Transaction) {
    return () => Entry.create(user, transaction, []);
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
