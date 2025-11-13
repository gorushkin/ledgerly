import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import {
  AccountRepositoryInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';

export class GetAllTransactionsUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryInterface,
    private readonly accountRepository: AccountRepositoryInterface,
  ) {}
  async execute(userId: UUID, query?: TransactionQueryParams) {
    if (query?.accountId) {
      await this.accountRepository.ensureUserOwnsAccount(
        userId,
        query?.accountId,
      );
    }

    return this.transactionRepository.getAll(userId, query);
  }
}
