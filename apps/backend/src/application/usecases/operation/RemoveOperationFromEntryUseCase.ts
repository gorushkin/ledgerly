import { UUID } from '@ledgerly/shared/types';
import { OperationRepository } from 'src/application/interfaces:toRefactor/OperationRepository.interface';
import { OperationDbRow } from 'src/db/schema';
import { Operation } from 'src/domain/operations/operation.entity';
import { DataBase } from 'src/types';

export class RemoveOperationFromEntryUseCase {
  constructor(private readonly operationRepository: OperationRepository) {}
  async execute(
    userId: UUID,
    operationId: UUID,
    tx: DataBase,
  ): Promise<OperationDbRow> {
    const operationRow = await this.operationRepository.getById(
      userId,
      operationId,
      tx,
    );

    // TODO: add entry validation

    if (!operationRow) {
      throw new Error('Operation not found');
    }

    if (operationRow.userId !== userId) {
      throw new Error('Operation does not belong to user');
    }

    const operation = Operation.fromPersistence(operationRow);

    if (operation.isDeleted()) {
      throw new Error('Operation is already deleted');
    }

    operation.delete();

    const result = await this.operationRepository.update(
      userId,
      operation.toPersistence(),
      tx,
    );

    return result;
  }
}
