import {
  EntryWithOperations,
  OperationDbRow,
  TransactionWithRelations,
} from 'src/db/schema';

import {
  EntryOperationsResponseDTO,
  EntryResponseDTO,
  OperationResponseDTO,
  TransactionResponseDTO,
} from '../dto';

export class TransactionViewMapper {
  static toView(transaction: TransactionWithRelations): TransactionResponseDTO {
    return {
      createdAt: transaction.createdAt,
      description: transaction.description,
      entries: transaction.entries.map(this.mapEntry.bind(this)),
      id: transaction.id,
      postingDate: transaction.postingDate,
      transactionDate: transaction.transactionDate,
      updatedAt: transaction.updatedAt,
      userId: transaction.userId,
    };
  }

  /**
   * Type guard to ensure array has exactly 2 elements and convert to tuple
   */
  private static ensureTwoOperations<T>(array: T[], entryId: string): [T, T] {
    if (array.length !== 2) {
      throw new Error(
        `Entry with id ${entryId} must have exactly 2 non-system operations, but got ${array.length}.`,
      );
    }
    if (!array[0] || !array[1]) {
      throw new Error(
        `Entry with id ${entryId} has undefined operation(s) in the array.`,
      );
    }
    return [array[0], array[1]];
  }

  private static mapEntry(entry: EntryWithOperations): EntryResponseDTO {
    const entryOperations = entry.operations
      .filter((op) => !op.isSystem)
      .map(this.mapOperation.bind(this));

    const operations: EntryOperationsResponseDTO = this.ensureTwoOperations(
      entryOperations,
      entry.id,
    );

    return {
      createdAt: entry.createdAt,
      id: entry.id,
      isTombstone: entry.isTombstone,
      operations,
      transactionId: entry.transactionId,
      updatedAt: entry.updatedAt,
      userId: entry.userId,
    };
  }

  private static mapOperation(op: OperationDbRow): OperationResponseDTO {
    return {
      accountId: op.accountId,
      amount: op.amount,
      createdAt: op.createdAt,
      description: op.description,
      entryId: op.entryId,
      id: op.id,
      isSystem: op.isSystem,
      updatedAt: op.updatedAt,
      userId: op.userId,
    };
  }
}
