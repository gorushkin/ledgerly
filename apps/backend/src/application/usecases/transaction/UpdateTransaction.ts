import { UUID } from '@ledgerly/shared/types';
import { compareTransaction } from 'src/application/comparers';
import {
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { TransactionMapperInterface } from 'src/application/mappers';
import { EntriesService } from 'src/application/services';
import { EnsureEntityExistsAndOwnedFn } from 'src/application/shared/ensureEntityExistsAndOwned';
import { Transaction, User } from 'src/domain';

export class UpdateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly entriesService: EntriesService,
    protected readonly ensureEntityExistsAndOwned: EnsureEntityExistsAndOwnedFn,
    protected readonly transactionMapper: TransactionMapperInterface,
  ) {}

  private async updateTransactionMetadata(
    user: User,
    transactionId: UUID,
    data: UpdateTransactionRequestDTO,
  ) {
    const transaction = await this.ensureEntityExistsAndOwned(
      user,
      this.transactionRepository.getById.bind(this.transactionRepository),
      transactionId,
      'Transaction',
    );

    const compareResult = compareTransaction(transaction, data);

    if (compareResult === 'unchanged') {
      return transaction;
    }

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

    return transaction;
  }

  private async updateEntries(
    user: User,
    transaction: Transaction,
    data: UpdateTransactionRequestDTO,
  ) {
    const hasEntryChanges =
      data.entries.create.length > 0 ||
      data.entries.update.length > 0 ||
      data.entries.delete.length > 0;

    if (!hasEntryChanges) {
      return transaction;
    }

    const updatedTransactionWithEntries =
      await this.entriesService.updateEntriesWithOperations(
        user,
        transaction,
        data.entries,
      );

    return updatedTransactionWithEntries;
  }

  execute(
    user: User,
    transactionId: UUID,
    data: UpdateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    return this.transactionManager.run(async () => {
      const transaction = await this.updateTransactionMetadata(
        user,
        transactionId,
        data,
      );

      const updatedTransactionWithEntries = await this.updateEntries(
        user,
        transaction,
        data,
      );

      return this.transactionMapper.toResponseDTO(
        updatedTransactionWithEntries,
      );
    });
  }
}
