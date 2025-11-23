import { UUID } from '@ledgerly/shared/types';
import {
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  EntryRepositoryInterface,
  OperationRepositoryInterface,
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
    protected readonly operationRepository: OperationRepositoryInterface,
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

      transaction.update({
        description: data.description,
        postingDate: data.postingDate,
        transactionDate: data.transactionDate,
      });

      await this.transactionRepository.update(
        user.getId().valueOf(),
        transactionId,
        transaction.toPersistence(),
      );
      // TODO: this part is a bit tricky, because we need to handle entries update properly
      // For now, we will just delete all existing entries and create new ones
      // let's think about a better approach later
      // If entries are undefined or an empty array, treat as 'no update to entries'
      if (!data.entries || data.entries.length === 0) {
        return this.transactionMapper.toResponseDTO(
          transaction,
          transactionDbRow.entries,
        );
      }

      const softDeletedEntries =
        await this.entryRepository.softDeleteByTransactionId(
          user.getId().valueOf(),
          transactionId,
        );

      const entryIds = softDeletedEntries.map((entry) => entry.id);
      await this.operationRepository.softDeleteByEntryIds(
        user.getId().valueOf(),
        entryIds,
      );

      const entries = await this.entryFactory.createEntriesWithOperations(
        user,
        transaction,
        data.entries,
      );

      for (const entry of entries) {
        transaction.addEntry(entry);
      }

      transaction.validateEntriesBalance();

      return this.transactionMapper.toResponseDTO(transaction);
    });
  }
}
