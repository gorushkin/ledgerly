import { UUID } from '@ledgerly/shared/types';

import { Operation } from '../../../domain/operations:toRefactor/operation.entity';
import type {
  CreateOperationRequestDTO,
  OperationResponseDTO,
} from '../../dto/transaction.dto';
import type { AccountService } from '../../interfaces:toRefactor/AccountService.interface';
import type { OperationRepository } from '../../interfaces:toRefactor/OperationRepository.interface';

export class AddOperationToEntryUseCase {
  constructor(
    private readonly operationRepository: OperationRepository,
    private readonly accountService: AccountService,
  ) {}

  async execute(
    userId: UUID,
    entryId: UUID,
    data: CreateOperationRequestDTO,
  ): Promise<OperationResponseDTO> {
    // 1. Validate account exists and belongs to user
    const account = await this.accountService.getById(userId, data.accountId);
    if (!account) {
      throw new Error(
        `Account with id ${data.accountId} not found or access denied`,
      );
    }

    // 2. Create operation through domain factory
    const operation = Operation.create(
      userId,
      entryId,
      data.accountId,
      data.amount as any, // TODO: Fix Money type conversion
      data.type,
      data.description,
      false, // isSystem defaults to false for user operations
    );

    // 3. Create operation in database using explicit create method
    const createdOperation = await this.operationRepository.create(
      userId,
      operation,
    );

    // 4. Return response DTO
    return this.mapToResponseDTO(createdOperation);
  }

  private mapToResponseDTO(operation: Operation): OperationResponseDTO {
    return {
      accountId: operation.accountId,
      amount: operation.amount,
      description: operation.description,
      displayAmount: `${operation.amount}`, // TODO: Add currency when getCurrency is fixed
      entryId: operation.entryId,
      id: operation.id!, // Safe after creation
      isSystem: operation.isSystem,
      type: operation.type,
    };
  }
}
