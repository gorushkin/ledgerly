import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import {
  AccountRepositoryInterface,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';

export class GetAllTransactionsUseCase {
  constructor(
    private readonly transactionQueryRepository: TransactionQueryRepositoryInterface,
    private readonly accountRepository: AccountRepositoryInterface,
  ) {}
  async execute(userId: UUID, query?: TransactionQueryParams) {
    if (query?.accountId) {
      await this.accountRepository.ensureUserOwnsAccount(
        userId,
        query.accountId,
      );
    }

    return this.transactionQueryRepository.findAll(userId, query);
  }
}
