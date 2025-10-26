import {
  CreateEntryRequestDTO,
  CreateOperationRequestDTO,
  CreateTransactionRequestDTO,
  OperationResponseDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
  EntryRepositoryInterface,
  OperationRepositoryInterface,
} from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import {
  OperationRepoInsert,
  TransactionDbRow,
  TransactionRepoInsert,
} from 'src/db/schema';
import { EntryDbRow, EntryRepoInsert } from 'src/db/schemas/entries';
import { Account, Operation, User } from 'src/domain';
import { Amount, DateValue } from 'src/domain/domain-core';
import { Entry } from 'src/domain/entries';
import { Transaction } from 'src/domain/transactions';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';

export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly operationRepository: OperationRepositoryInterface,
    protected readonly accountRepository: AccountRepository,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async execute(
    user: User,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    return await this.transactionManager.run(async () => {
      const createTransaction = () => this.createTransaction(user, data);

      const transaction = createTransaction();

      await this.saveTransaction(transaction, createTransaction);

      const entries = await this.createEntriesWithOperations(
        user,
        transaction,
        data.entries,
      );

      for (const entry of entries) {
        transaction.addEntry(entry);
      }

      transaction.validateBalance();

      return transaction.toResponseDTO();
    });
  }

  private async createOperationsForEntry(
    user: User,
    entry: Entry,
    operations: CreateOperationRequestDTO[],
  ) {
    const createOperations = operations.map(async (opData) => {
      const rawAccount = await this.accountRepository.getById(
        user.getId().valueOf(),
        opData.accountId,
      );

      if (!rawAccount) {
        throw new Error(`Account not found: ${opData.accountId}`);
      }

      const account = Account.restore(rawAccount);

      const createOperation = this.createOperation(
        user,
        account,
        entry,
        opData,
      );

      const operation = createOperation();

      await this.saveOperation(operation, createOperation);

      return operation;
    });

    return await Promise.all(createOperations);
  }

  private async createEntriesWithOperations(
    user: User,
    transaction: Transaction,
    rawEntries: CreateEntryRequestDTO[],
  ): Promise<Entry[]> {
    const createEntries = rawEntries.map(async (entryData) => {
      const createEntry = this.createEntry(user, transaction);

      const entry = createEntry();

      await this.saveEntry(entry, createEntry);

      const operations = await this.createOperationsForEntry(
        user,
        entry,
        entryData.operations,
      );

      entry.addOperations(operations);

      return entry;
    });

    return Promise.all(createEntries);
  }

  private async saveTransaction(
    transaction: Transaction,
    createTransaction: () => Transaction,
  ) {
    const result = await this.saveWithIdRetry<
      TransactionRepoInsert,
      Transaction,
      TransactionDbRow
    >(
      transaction,
      this.transactionRepository.create.bind(this.transactionRepository),
      createTransaction,
    );

    return result;
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

  private async saveOperation(
    entry: Operation,
    createOperation: () => Operation,
  ) {
    const result = await this.saveWithIdRetry<
      OperationRepoInsert,
      Operation,
      OperationResponseDTO
    >(
      entry,
      this.operationRepository.create.bind(this.operationRepository),
      createOperation,
    );

    return result;
  }

  private createTransaction(user: User, data: CreateTransactionRequestDTO) {
    const postingDateVO = DateValue.restore(data.postingDate);
    const transactionDateVO = DateValue.restore(data.transactionDate);

    const createTransaction = () =>
      Transaction.create(
        user.getId(),
        data.description,
        postingDateVO,
        transactionDateVO,
      );
    return createTransaction();
  }

  private createEntry(user: User, transaction: Transaction) {
    return () => Entry.create(user, transaction, []);
  }

  private createOperation(
    user: User,
    account: Account,
    entry: Entry,
    data: CreateOperationRequestDTO,
  ) {
    const amount = Amount.create(data.amount);

    return () =>
      Operation.create(user, account, entry, amount, data.description ?? '');
  }
}
