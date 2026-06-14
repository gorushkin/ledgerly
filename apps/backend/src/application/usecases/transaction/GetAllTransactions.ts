import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import {
  TransactionListResponseDTO,
  TransactionReadModelResponseMapper,
} from 'src/application';
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
    query: TransactionQueryParams,
  ): Promise<TransactionListResponseDTO> {
    if (query.accountId) {
      await this.accountRepository.ensureUserOwnsAccount(
        userId,
        query.accountId,
      );
    }

    const { items, total } = await this.transactionQueryRepository.findAll(
      userId,
      query,
    );

    const { page, pageSize } = query;
    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map((transaction) =>
        TransactionReadModelResponseMapper.toResponseDTO(transaction),
      ),
      pagination: {
        hasNextPage: page < totalPages,
        hasPreviousPage: totalPages > 0 && page > 1,
        page,
        pageSize,
        total,
        totalPages,
      },
    };
  }
}
