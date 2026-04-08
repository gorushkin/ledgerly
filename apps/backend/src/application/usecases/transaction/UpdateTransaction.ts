import { UUID } from '@ledgerly/shared/types';
import {
  TransactionResponseDTO,
  UpdateTransactionRequestDTO,
} from 'src/application/dto';
import {
  TransactionManagerInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { OperationMapper, TransactionMapper } from 'src/application/mappers';
import { TransactionContextLoader } from 'src/application/services';
import { EnsureEntityExistsAndOwnedFn } from 'src/application/shared/ensureEntityExistsAndOwned';
import { User } from 'src/domain';
import { Id } from 'src/domain/domain-core';

export class UpdateTransactionUseCase {
  constructor(
    protected readonly transactionManager: TransactionManagerInterface,
    protected readonly transactionRepository: TransactionRepositoryInterface,
    protected readonly ensureEntityExistsAndOwned: EnsureEntityExistsAndOwnedFn,
    protected readonly transactionContextLoader: TransactionContextLoader,
  ) {}

  execute(
    user: User,
    transactionId: UUID,
    data: UpdateTransactionRequestDTO,
  ): Promise<TransactionResponseDTO> {
    return this.transactionManager.run(async () => {
      const transaction = await this.ensureEntityExistsAndOwned(
        user,
        this.transactionRepository.getById.bind(this.transactionRepository),
        transactionId,
        'Transaction',
      );

      const operationsData = [
        ...data.operations.create,
        ...data.operations.update,
      ];

      const transactionContext =
        await this.transactionContextLoader.loadContext(user, operationsData);

      const isUpdated = transaction.applyUpdate(
        {
          metadata: {
            description: data.description,
            postingDate: data.postingDate,
            transactionDate: data.transactionDate,
          },
          operations: {
            create: data.operations.create.map((data) =>
              OperationMapper.toCreateOperationProps(data, transactionContext),
            ),
            delete: data.operations.delete.map((id) => Id.fromPersistence(id)),
            update: data.operations.update.map((data) =>
              OperationMapper.toUpdateOperationProps(data, transactionContext),
            ),
          },
        },
        transactionContext,
      );

      if (isUpdated) {
        await this.transactionRepository.save(
          user.getId().valueOf(),
          transaction,
        );
      }

      return TransactionMapper.toResponseDTO(transaction);
    });
  }
}
