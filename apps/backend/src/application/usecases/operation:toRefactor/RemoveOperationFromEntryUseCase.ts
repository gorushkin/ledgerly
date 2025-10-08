import { UUID } from '@ledgerly/shared/types';

import type { OperationRepository } from '../../interfaces:toRefactor/OperationRepository.interface';

export class RemoveOperationFromEntryUseCase {
  constructor(private readonly operationRepository: OperationRepository) {}

  async execute(userId: UUID, operationId: UUID): Promise<boolean> {
    // 1. Check if operation exists and belongs to user
    const operation = await this.operationRepository.getById(
      userId,
      operationId,
    );
    if (!operation) {
      throw new Error(
        `Operation with id ${operationId} not found or access denied`,
      );
    }

    // 2. Delete operation using repository method
    const deleted = await this.operationRepository.delete(userId, operationId);

    if (!deleted) {
      throw new Error(`Failed to delete operation with id ${operationId}`);
    }

    return true;
  }
}
