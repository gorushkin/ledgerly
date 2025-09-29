import { UUID } from '@ledgerly/shared/types';

import type { EntryResponseDTO } from '../../dto/transaction.dto';
import type { AccountService } from '../../interfaces:toRefactor/AccountService.interface';
import type { EntryRepository } from '../../interfaces:toRefactor/EntryRepository.interface';

export class CreateMultiCurrencyEntryUseCase {
  constructor(
    private readonly entryRepository: EntryRepository,
    private readonly accountService: AccountService,
  ) {}

  async execute(
    userId: UUID,
    transactionId: UUID,
    fromAccountId: UUID,
    toAccountId: UUID,
    amount: number,
    exchangeRate?: number,
    description?: string,
  ): Promise<EntryResponseDTO> {
    // TODO: Implement multi-currency entry creation with trading operations
    throw new Error('Not implemented');
  }
}
