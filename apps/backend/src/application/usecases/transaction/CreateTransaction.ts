import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapperInterface } from 'src/application/mappers';
import { EntriesContextLoader } from 'src/application/services/EntriesService';
import { User } from 'src/domain';
import { Transaction } from 'src/domain/transactions';

export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly transactionMapper: TransactionMapperInterface,
    protected readonly entriesContextLoader: EntriesContextLoader,
  ) {}

  async execute(
    user: User,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    return await this.transactionManager.run(async () => {
      const context = await this.entriesContextLoader.loadForEntries(
        user,
        data.entries,
      );

      const transaction = Transaction.create(user, data, context);

      await this.transactionRepository.create(transaction);

      return this.transactionMapper.toResponseDTO(transaction);
    });
  }
}
