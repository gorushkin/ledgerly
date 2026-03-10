import { TransactionDbRow } from 'src/db/schema';
import { Transaction } from 'src/domain';

import { TransactionResponseDTO } from '../dto';

import { OperationMapper } from './operation.mapper';

export class TransactionMapper {
  static toResponseDTO(transaction: Transaction): TransactionResponseDTO {
    const snapshot = transaction.toSnapshot();

    return {
      createdAt: snapshot.createdAt,
      currency: snapshot.currency,
      description: snapshot.description,
      id: snapshot.id,
      operations: transaction
        .getOperations()
        .map((operation) => OperationMapper.toResponseDTO(operation)),
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }

  static toDBRow(transaction: Transaction): TransactionDbRow {
    const snapshot = transaction.toSnapshot();

    return {
      createdAt: snapshot.createdAt,
      currency: snapshot.currency,
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      version: snapshot.version,
    };
  }
}
