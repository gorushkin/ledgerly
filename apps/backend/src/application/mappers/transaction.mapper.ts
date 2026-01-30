import { TransactionDbRow } from 'src/db/schema';
import { Transaction } from 'src/domain';

import { TransactionResponseDTO } from '../dto';

import { EntryMapper } from './entry.mapper';

export class TransactionMapper {
  static toResponseDTO(transaction: Transaction): TransactionResponseDTO {
    const snapshot = transaction.toSnapshot();

    return {
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      entries: transaction
        .getEntries()
        .map((entry) => EntryMapper.toResponseDTO(entry)),
      id: snapshot.id,
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
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }
}
