import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapper } from 'src/application/mappers';
import { TransactionContextLoader } from 'src/application/services/TransactionService';
import { User } from 'src/domain';
import { Transaction } from 'src/domain/transactions';

export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly transactionContextLoader: TransactionContextLoader,
  ) {}

  async execute(
    user: User,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    const createdTransaction = await this.transactionManager.run(async () => {
      const context = await this.transactionContextLoader.loadContext(
        user,
        data.entries,
      );

      const transaction = Transaction.create(user.getId(), data, context);

      await this.transactionRepository.save(
        user.getId().valueOf(),
        transaction,
      );

      return transaction;
    });

    return TransactionMapper.toResponseDTO(createdTransaction);
  }
}
