import { Entry, Transaction, User } from 'src/domain';

import { CreateEntryRequestDTO, UpdateTransactionRequestDTO } from '../../dto';

import { EntriesContextLoader } from './entries.context-loader';
import { EntryCreator } from './entries.creator';
import { EntryUpdater } from './entries.updater';

export class EntriesService {
  constructor(
    protected readonly entriesContextLoader: EntriesContextLoader,
    protected readonly entryCreator: EntryCreator,
    protected readonly entryUpdater: EntryUpdater,
  ) {}

  async createEntriesWithOperations(
    user: User,
    transaction: Transaction,
    rawEntries: CreateEntryRequestDTO[],
  ): Promise<Entry[]> {
    const { accountsMap, systemAccountsMap } =
      await this.entriesContextLoader.loadForEntries(user, rawEntries);

    const createEntriesPromises = rawEntries.map(async (entryData) =>
      this.entryCreator.createEntryWithOperations(
        user,
        transaction,
        entryData,
        accountsMap,
        systemAccountsMap,
      ),
    );

    return await Promise.all(createEntriesPromises);
  }

  async updateEntriesWithOperations(
    user: User,
    transaction: Transaction,
    newEntriesData: UpdateTransactionRequestDTO['entries'],
  ): Promise<Transaction> {
    const entryContext = await this.entriesContextLoader.loadForEntries(user, [
      ...newEntriesData.create,
      ...newEntriesData.update,
    ]);

    const updatedTransaction = await this.entryUpdater.execute({
      entryContext,
      newEntriesData,
      transaction,
      user,
    });

    return updatedTransaction;
  }
}
