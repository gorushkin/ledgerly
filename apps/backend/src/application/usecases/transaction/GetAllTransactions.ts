import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import { TransactionResponseDTO, TransactionViewMapper } from 'src/application';
import {
  AccountRepositoryInterface,
  TransactionQueryRepositoryInterface,
} from 'src/application/interfaces';

export class GetAllTransactionsUseCase {
  constructor(
    private readonly transactionQueryRepository: TransactionQueryRepositoryInterface,
    private readonly accountRepository: AccountRepositoryInterface,
  ) {}
  async execute(
    userId: UUID,
    query?: TransactionQueryParams,
  ): Promise<TransactionResponseDTO[]> {
    if (query?.accountId) {
      await this.accountRepository.ensureUserOwnsAccount(
        userId,
        query.accountId,
      );
    }

    const transactions = await this.transactionQueryRepository.findAll(
      userId,
      query,
    );

    return transactions.map((transaction) =>
      TransactionViewMapper.toView(transaction),
    );
  }
}
