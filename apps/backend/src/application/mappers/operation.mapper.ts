import { OperationRepoInsert } from 'src/db/schema';
import { Operation } from 'src/domain/operations/operation.entity';

import { OperationResponseDTO } from '../dto';

export class OperationMapper {
  static toResponseDTO(operation: Operation): OperationResponseDTO {
    const snapshot = operation.toSnapshot();

    return {
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isSystem: snapshot.isSystem,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      value: snapshot.value,
    };
  }

  static toDBRow(operation: Operation): OperationRepoInsert {
    const snapshot = operation.toSnapshot();
    return {
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      value: snapshot.value,
    };
  }
}
