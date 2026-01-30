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
      entryId: snapshot.entryId,
      id: snapshot.id,
      isSystem: snapshot.isSystem,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }

  static toDBRow(operation: Operation): OperationRepoInsert {
    const snapshot = operation.toSnapshot();
    return {
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      entryId: snapshot.entryId,
      id: snapshot.id,
      isSystem: snapshot.isSystem,
      isTombstone: snapshot.isTombstone,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }
}
