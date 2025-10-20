import { UUID } from '@ledgerly/shared/types';
import {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from 'src/application/dto';
import {
  TransactionRepositoryInterface,
  UserRepositoryInterface,
} from 'src/application/interfaces';
import { SaveWithIdRetryType } from 'src/application/shared/saveWithIdRetry';
import { TransactionRepoInsert } from 'src/db/schema';
import { DateValue, Id } from 'src/domain/domain-core';
import { Transaction } from 'src/domain/transactions';

export class CreateTransactionUseCase {
  constructor(
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly userRepository: UserRepositoryInterface,
    protected readonly saveWithIdRetry: SaveWithIdRetryType,
  ) {}

  execute(userId: UUID, data: CreateTransactionRequestDTO) {
    const userIdVO = Id.fromPersistence(userId);

    const postingDateVO = DateValue.restore(data.postingDate);
    const transactionDateVO = DateValue.restore(data.transactionDate);

    const createTransaction = () =>
      Transaction.create(
        userIdVO,
        data.description,
        postingDateVO,
        transactionDateVO,
      );

    const transaction = createTransaction();

    return this.saveWithIdRetry<
      TransactionRepoInsert,
      Transaction,
      TransactionResponseDTO
    >(
      transaction,
      this.transactionRepository.create.bind(this.transactionRepository),
      createTransaction,
    );
  }

  protected async ensureUserExists(userId: UUID): Promise<void> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new Error('User not found');
    }
  }
}
