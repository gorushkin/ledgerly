import { UUID } from '@ledgerly/shared/types';
import {
  TransactionRepositoryInterface,
  TransactionResponseDTO,
} from 'src/application';

import { TransactionViewMapper } from '../../mappers';

export class GetTransactionByIdUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryInterface,
  ) {}
  async execute(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionResponseDTO> {
    const transactionRecord = await this.transactionRepository.getById(
      userId,
      transactionId,
    );

    if (!transactionRecord) {
      throw new Error('Transaction not found');
    }

    // Transform database model to response DTO using mapper
    // This handles the conversion from OperationDbRow[] to tuple [OperationResponseDTO, OperationResponseDTO]
    return TransactionViewMapper.toView(transactionRecord);
  }
}
