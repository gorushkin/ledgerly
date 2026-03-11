import { OperationDbRow, TransactionWithRelations } from 'src/db/schema';

import { OperationResponseDTO, TransactionResponseDTO } from '../dto';

// TODO: This mapper is similar to TransactionMapper but works with DB rows directly.
// Consider refactoring to reduce code duplication.
export class TransactionViewMapper {
  static toView(transaction: TransactionWithRelations): TransactionResponseDTO {
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
    };
  }

  private static mapOperation(op: OperationDbRow): OperationResponseDTO {
    return {
      accountId: op.accountId,
      amount: op.amount,
      createdAt: op.createdAt,
      description: op.description,
      id: op.id,
      isSystem: op.isSystem,
      transactionId: op.transactionId,
      updatedAt: op.updatedAt,
      userId: op.userId,
      value: op.value,
    };
  }
}
