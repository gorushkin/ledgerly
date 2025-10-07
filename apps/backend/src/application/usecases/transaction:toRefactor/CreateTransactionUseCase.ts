import { UUID } from '@ledgerly/shared/types';

import type {
  CreateTransactionRequestDTO,
  TransactionResponseDTO,
} from '../../dto/transaction.dto';
import type { AccountService } from '../../interfaces:toRefactor/AccountRepository.interface';
import type { TransactionRepository } from '../../interfaces:toRefactor/TransactionRepository.interface';

export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly accountService: AccountService,
  ) {}

  async execute(
    userId: UUID,
    data: CreateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    // TODO: Implement transaction creation logic
    throw new Error('Not implemented');
  }
}
