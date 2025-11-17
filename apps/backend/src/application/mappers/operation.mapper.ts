import { Operation } from 'src/domain/operations';

import { OperationResponseDTO } from '../dto';

export class OperationMapper {
  static toResponseDTO(operation: Operation): OperationResponseDTO {
    return {
      accountId: operation.getAccountId().valueOf(),
      amount: operation.amount.valueOf(),
      createdAt: operation.getCreatedAt().valueOf(),
      description: operation.description,
      entryId: operation.id.valueOf(),
      id: operation.id.valueOf(),
      isSystem: operation.isSystem,
      updatedAt: operation.getUpdatedAt().valueOf(),
      userId: operation.getUserId().valueOf(),
    };
  }
}
