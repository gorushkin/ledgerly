import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { Account, Entry, Transaction, User } from 'src/domain';

import { CreateEntryRequestDTO } from '../../dto';
import { EntryRepositoryInterface } from '../../interfaces';
import { OperationFactory } from '../operation.factory';

export class EntryCreator {
  constructor(
    protected readonly operationFactory: OperationFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
  ) {}
  async createEntryWithOperations(
    user: User,
    transaction: Transaction,
    entryData: CreateEntryRequestDTO,
    accountsMap: Map<UUID, Account>,
    systemAccountsMap: Map<CurrencyCode, Account>,
  ): Promise<Entry> {
    const entry = Entry.create(user, transaction, entryData.description);

    await this.entryRepository.create(entry.toPersistence());

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
}
