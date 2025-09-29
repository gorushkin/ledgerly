import { UUID } from '@ledgerly/shared/types';

import type { TransactionResponseDTO } from '../../dto/transaction.dto';
import type { TransactionRepository } from '../../interfaces:toRefactor/TransactionRepository.interface';

export class GetTransactionsUseCase {
  constructor(private readonly transactionRepository: TransactionRepository) {}

  async execute(
    userId: UUID,
    limit = 50,
    offset = 0,
  ): Promise<TransactionResponseDTO[]> {
    // TODO: Implement get transactions list logic
    throw new Error('Not implemented');
  }
}
