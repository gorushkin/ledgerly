import { UUID } from '@ledgerly/shared/types';
import { TransactionQueryRepositoryInterface } from 'src/application';
import { TransactionWithRelations } from 'src/db/schema';

export class GetTransactionByIdUseCase {
  constructor(
    private readonly transactionQueryRepository: TransactionQueryRepositoryInterface,
  ) {}
  async execute(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations> {
    const transactionRecord = await this.transactionQueryRepository.findById(
      userId,
      transactionId,
    );

    if (!transactionRecord) {
      // TODO: Replace with proper NotFound error
      throw new Error('Transaction not found');
    }

    return transactionRecord;
  }
}
