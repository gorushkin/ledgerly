import {
  OperationReadModel,
  TransactionReadModel,
} from 'src/application/read-models';
import { OperationDbRow, TransactionWithRelations } from 'src/db/schema';

export class TransactionReadModelMapper {
  static fromPersistence(
    transaction: TransactionWithRelations,
  ): TransactionReadModel {
    return {
      createdAt: transaction.createdAt,
      currency: transaction.currency,
      description: transaction.description,
      id: transaction.id,
      operations: transaction.operations.map(this.mapOperation.bind(this)),
      postingDate: transaction.postingDate,
      transactionDate: transaction.transactionDate,
      updatedAt: transaction.updatedAt,
      userId: transaction.userId,
      version: transaction.version,
    };
  }

  private static mapOperation(operation: OperationDbRow): OperationReadModel {
    return {
      accountId: operation.accountId,
      amount: operation.amount,
      createdAt: operation.createdAt,
      description: operation.description,
      id: operation.id,
      isSystem: operation.isSystem,
      transactionId: operation.transactionId,
      updatedAt: operation.updatedAt,
      userId: operation.userId,
      value: operation.value,
    };
  }
}
