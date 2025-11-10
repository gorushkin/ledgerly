import { UUID } from '@ledgerly/shared/types';
import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
  TransactionManagerInterface,
  TransactionRepositoryInterface,
  TransactionResponseDTO,
} from 'src/application';
import { TransactionViewMapper } from 'src/domain/transactions/TransactionViewMapper';

export class GetTransactionByIdUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    private readonly transactionRepository: TransactionRepositoryInterface,
    private readonly entryRepository: EntryRepositoryInterface,
    private readonly operationRepository: OperationRepositoryInterface,
  ) {}
  async execute(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionResponseDTO> {
    const result = await this.transactionManager.run(async () => {
      const transactionRecord = await this.transactionRepository.getById(
        userId,
        transactionId,
      );

      if (!transactionRecord) {
        throw new Error('Transaction not found');
      }

      const entryRecords = await this.entryRepository.getByTransactionId(
        userId,
        transactionId,
      );

      const entries = [];

      for (const entry of entryRecords) {
        const operations = await this.operationRepository.getByEntryId(
          userId,
          entry.id,
        );

        entries.push({
          ...entry,
          operations,
        });
      }

      const transaction = TransactionViewMapper.toView(
        transactionRecord,
        entries,
      );

      return transaction;
    });

    return result;
  }
}
