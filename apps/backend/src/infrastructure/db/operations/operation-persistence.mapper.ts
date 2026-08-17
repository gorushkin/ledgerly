import { OperationRepoInsert } from 'src/db/schema';
import { Operation } from 'src/domain/operations/operation.entity';
import { OperationSnapshot } from 'src/domain/operations/types';

export class OperationPersistenceMapper {
  static toDBRow(operation: Operation): OperationRepoInsert {
    return OperationPersistenceMapper.toDBRowFromSnapshot(
      operation.toSnapshot(),
    );
  }

  static toDBRowFromSnapshot(snapshot: OperationSnapshot): OperationRepoInsert {
    return {
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      value: snapshot.value,
    };
  }
}
