import { TransactionResponseDTO, UUID } from '@ledgerly/shared/types';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';

import { UserService } from './user.service';

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userService: UserService,
  ) {}
  getAllByUserId(_userId: UUID): Promise<TransactionResponseDTO[]> {
    throw new Error('Method not implemented.');
  }

  getById(
    _userId: UUID,
    _id: UUID,
  ): Promise<TransactionResponseDTO | undefined> {
    throw new Error('Method not implemented.');
  }

  create(): Promise<TransactionResponseDTO> {
    throw new Error('Method not implemented.');
  }

  update(): Promise<TransactionResponseDTO> {
    throw new Error('Method not implemented.');
  }

  delete(): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
