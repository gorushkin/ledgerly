import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapper } from 'src/application/mappers';
import { EntryFactory, OperationFactory } from 'src/application/services';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { TransactionDbRow, TransactionRepoInsert } from 'src/db/schema';
import { User } from 'src/domain';
import { DateValue } from 'src/domain/domain-core';
import { Transaction } from 'src/domain/transactions';

export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly entryFactory: EntryFactory,
    protected readonly operationFactory: OperationFactory,
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

      const entries = await this.entryFactory.createEntriesWithOperations(
        user,
        transaction,
        data.entries,
      );

      for (const entry of entries) {
        transaction.addEntry(entry);
      }

      transaction.validateBalance();

      return TransactionMapper.toResponseDTO(transaction);
    });
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
}
