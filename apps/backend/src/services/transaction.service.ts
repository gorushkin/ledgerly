import { TransactionResponse, UUID } from '@ledgerly/shared/types';
import { TransactionRepository } from 'src/infrastructure/db/TransactionRepository';

import { UserService } from './user.service';

export class TransactionService {
  constructor(
    private readonly transactionRepository: TransactionRepository,
    private readonly userService: UserService,
  ) {}
  async getAll(userId: UUID): Promise<TransactionResponse[]> {
    await this.userService.validateUser(userId);

    return await this.transactionRepository.getAll(userId);
  }
}
