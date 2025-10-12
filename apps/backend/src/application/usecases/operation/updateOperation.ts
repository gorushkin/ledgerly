import { UUID } from '@ledgerly/shared/types';
import { UpdateOperationRequestDTO } from 'src/application/dto';
import { OperationRepository } from 'src/application/interfaces/OperationRepository.interface';
import { Amount } from 'src/domain/domain-core';
import { Operation } from 'src/domain/operations/operation.entity';
import { DataBase } from 'src/types';

import { GetAccountByIdUseCase } from '../accounts';

export class UpdateOperationUseCase {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
  ) {}

  async execute(
    userId: UUID,
    request: UpdateOperationRequestDTO,
    tx: DataBase,
  ): Promise<void> {
    const { amount, description, id } = request;

    // TODO: add entryId validation

    const operationRow = await this.operationRepository.getById(userId, id, tx);

    if (!operationRow) {
      throw new Error('Operation not found');
    }

    if (operationRow.userId !== userId) {
      throw new Error('Operation does not belong to user');
    }

    // TODO: validate that account belongs to user
    await this.getAccountByIdUseCase.execute(
      userId,
      operationRow.accountId,
      tx,
    );

    const operation = Operation.fromPersistence(operationRow);

    if (!operation.canBeUpdated()) {
      throw new Error('Operation cannot be updated');
    }

    if (amount !== undefined) {
      operation.updateAmount(Amount.create(amount));
    }

    if (description !== undefined) {
      operation.updateDescription(description);
    }

    await this.operationRepository.update(
      operation.getId().valueOf(),
      operation.toPersistence(),
      tx,
    );
  }
}
