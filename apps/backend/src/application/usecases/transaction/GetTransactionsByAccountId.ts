import { UUID } from '@ledgerly/shared/types';
import { TransactionRepositoryInterface } from 'src/application/interfaces';

export class GetTransactionsByAccountIdUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryInterface,
  ) {}
  async execute(userId: UUID, accountId: UUID) {
    console.log('accountId: ', accountId);
    console.log('userId: ', userId);

    const transactions = await this.transactionRepository.getByAccountId(
      userId,
      accountId,
    );
    console.log('transactions: ', transactions);

    return transactions;
  }
}
