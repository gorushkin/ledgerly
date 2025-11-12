import { UUID } from '@ledgerly/shared/types';
import {
  AccountRepositoryInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';

export class GetTransactionsByAccountIdUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryInterface,
    private readonly accountRepository: AccountRepositoryInterface,
  ) {}
  async execute(userId: UUID, accountId: UUID) {
    await this.accountRepository.ensureUserOwnsAccount(userId, accountId);

    const transactions = await this.transactionRepository.getByAccountId(
      userId,
      accountId,
    );

    return transactions;
  }
}
