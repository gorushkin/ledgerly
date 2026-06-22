import { UUID } from '@ledgerly/shared/types';
import {
  TransactionQueryRepositoryInterface,
  TransactionReadModelResponseMapper,
  TransactionResponseDTO,
} from 'src/application';
import { EntityNotFoundError } from 'src/application/application.errors';
import { Transaction } from 'src/domain';

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
      throw new EntityNotFoundError({
        entityId: transactionId,
        entityType: Transaction.entityType,
      });
    }

    return TransactionReadModelResponseMapper.toResponseDTO(transactionRecord);
  }
}
