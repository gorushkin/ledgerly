import { UUID } from '@ledgerly/shared/types';
import { TransactionRepositoryInterface } from 'src/application';
import { TransactionWithRelations } from 'src/db/schema';

export class GetTransactionByIdUseCase {
  constructor(
    private readonly transactionRepository: TransactionRepositoryInterface,
  ) {}
  async execute(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations> {
    const transactionRecord = await this.transactionRepository.getById(
      userId,
      transactionId,
    );

    if (!transactionRecord) {
      throw new Error('Transaction not found');
    }

    return transactionRecord;
  }
}
