import { UUID } from '@ledgerly/shared/types';

import type {
  EntryResponseDTO,
  UpdateEntryRequestDTO,
} from '../../dto/transaction.dto';
import type { EntryRepository } from '../../interfaces:toRefactor/EntryRepository.interface';

export class UpdateEntryUseCase {
  constructor(private readonly entryRepository: EntryRepository) {}

  async execute(
    userId: UUID,
    entryId: UUID,
    data: UpdateEntryRequestDTO,
  ): Promise<EntryResponseDTO> {
    // TODO: Implement update entry logic
    throw new Error('Not implemented');
  }
}
