import { UUID } from '@ledgerly/shared/types';
import {
  EntityNotFoundError,
  TransactionResponseDTO,
  TransactionViewMapper,
  TransactionQueryRepositoryInterface,
} from 'src/application';

export class GetTransactionByIdUseCase {
  constructor(
    private readonly transactionQueryRepository: TransactionQueryRepositoryInterface,
  ) {}
  async execute(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionResponseDTO> {
    const transactionRecord = await this.transactionQueryRepository.findById(
      userId,
      transactionId,
    );

    if (!transactionRecord) {
      throw new EntityNotFoundError('Transaction');
    }

    return TransactionViewMapper.toView(transactionRecord);
  }
}
