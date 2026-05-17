import { UUID } from '@ledgerly/shared/types';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { EnsureEntityExistsAndOwnedFn } from 'src/application/shared/ensureEntityExistsAndOwned';
import { User } from 'src/domain';

export class DeleteTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly ensureEntityExistsAndOwned: EnsureEntityExistsAndOwnedFn,
  ) {}

  async execute(user: User, transactionId: UUID): Promise<void> {
    return this.transactionManager.run(async () => {
      const transaction = await this.ensureEntityExistsAndOwned(
        user,
        this.transactionRepository.getById.bind(this.transactionRepository),
        transactionId,
        'Transaction',
      );

      transaction.markAsDeleted();

      await this.transactionRepository.softDelete(
        user.getId().valueOf(),
        transaction,
      );
    });
  }
}
