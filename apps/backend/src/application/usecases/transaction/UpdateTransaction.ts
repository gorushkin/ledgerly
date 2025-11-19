import { UUID } from '@ledgerly/shared/types';
import {
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  EntryRepositoryInterface,
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapperInterface } from 'src/application/mappers';
import { EntryFactory } from 'src/application/services';
import { EnsureEntityExistsAndOwnedFn } from 'src/application/shared/ensureEntityExistsAndOwned';
import { Transaction, User } from 'src/domain';

export class UpdateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly entryFactory: EntryFactory,
    protected readonly entryRepository: EntryRepositoryInterface,
    protected readonly ensureEntityExistsAndOwned: EnsureEntityExistsAndOwnedFn,
    protected readonly transactionMapper: TransactionMapperInterface,
  ) {}
  execute(
    user: User,
    transactionId: UUID,
    data: UpdateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    return this.transactionManager.run(async () => {
      const transactionDbRow = await this.ensureEntityExistsAndOwned(
        user,
        this.transactionRepository.getById.bind(this.transactionRepository),
        transactionId,
        'Transaction',
      );

      const transaction = Transaction.restore(transactionDbRow);

      transaction.update(data);

      await this.transactionRepository.update(
        user.getId().valueOf(),
        transactionId,
        transaction.toPersistence(),
      );

      if (!data.entries || data.entries.length === 0) {
        return this.transactionMapper.toResponseDTO(
          transaction,
          transactionDbRow.entries,
        );
      }

      await this.entryRepository.deleteByTransactionId(
        user.getId().valueOf(),
        transactionId,
      );

      const entries = await this.entryFactory.createEntriesWithOperations(
        user,
        transaction,
        data.entries,
      );

      for (const entry of entries) {
        transaction.addEntry(entry);
      }

      transaction.validateBalance();

      return this.transactionMapper.toResponseDTO(transaction);
    });
  }
}
