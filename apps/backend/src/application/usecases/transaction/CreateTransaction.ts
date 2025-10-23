import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import { TransactionRepositoryInterface } from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { TxType } from 'src/db';
import { TransactionRepoInsert } from 'src/db/schema';
import { Account, Operation, User } from 'src/domain';
import { Amount, DateValue } from 'src/domain/domain-core';
import { Entry } from 'src/domain/entries';
import { Transaction } from 'src/domain/transactions';
import { AccountRepository } from 'src/infrastructure/db/accounts/account.repository';
export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly accountRepository: AccountRepository,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  async execute(
    user: User,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    const db = this.transactionRepository.getDB();

    return await db.transaction(async (tx: TxType) => {
      const postingDateVO = DateValue.restore(data.postingDate);
      const transactionDateVO = DateValue.restore(data.transactionDate);

      const createTransaction = () =>
        Transaction.create(
          user.getId(),
          data.description,
          postingDateVO,
          transactionDateVO,
        );

      const transaction = createTransaction();

      const createEntries = data.entries.map(async (entryData) => {
        const entry = Entry.create(user, transaction, []);
        const createOperations = entryData.operations.map(async (opData) => {
          const rawAccount = await this.accountRepository.getById(
            user.id,
            opData.accountId,
            tx,
          );

          const account = Account.restore(rawAccount);

          const amount = Amount.create(opData.amount);
          return Operation.create(
            user,
            account,
            entry,
            amount,
            opData.description ?? '',
          );
        });

        const operations = await Promise.all(createOperations);
        operations.forEach((operation) => entry.addOperation(operation));

        return entry;
      });

      const entries = await Promise.all(createEntries);
      entries.forEach((entry) => transaction.addEntry(entry));

      const result = await this.saveWithIdRetry<
        TransactionRepoInsert,
        Transaction,
        TransactionResponseDTO
      >(
        transaction,
        () =>
          this.transactionRepository.create(transaction.toPersistence(), tx),
        createTransaction,
      );

      return result;
    });
  }
}
