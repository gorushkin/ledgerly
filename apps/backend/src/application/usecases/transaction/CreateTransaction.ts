import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapperInterface } from 'src/application/mappers';
import { EntryFactory } from 'src/application/services';
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
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
    protected readonly transactionMapper: TransactionMapperInterface,
  ) {}

  async execute(
    user: User,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    return await this.transactionManager.run(async () => {
      const transactionFactory = this.createTransaction(user, data);

      const transaction = await this.saveTransaction(transactionFactory);

      const entries = await this.entryFactory.createEntriesWithOperations(
        user,
        transaction,
        data.entries,
      );

      for (const entry of entries) {
        transaction.addEntry(entry);
      }

      transaction.validateBalance();

      return this.transactionMapper.toResponseDTO(transaction);
    });
  }

  private async saveTransaction(createTransaction: () => Transaction) {
    const result = await this.saveWithIdRetry<
      TransactionRepoInsert,
      Transaction,
      TransactionDbRow
    >(
      this.transactionRepository.create.bind(this.transactionRepository),
      createTransaction,
    );

    return result;
  }

  private createTransaction(user: User, data: CreateTransactionRequestDTO) {
    const postingDateVO = DateValue.restore(data.postingDate);
    const transactionDateVO = DateValue.restore(data.transactionDate);

    return () =>
      Transaction.create(
        user.getId(),
        data.description,
        postingDateVO,
        transactionDateVO,
      );
  }
}
