import { Transaction } from '../../domain/transactions';
import { TransactionResponseDTO } from '../dto';

import { EntryMapper } from './entry.mapper';

export class TransactionMapper {
  static toResponseDTO(transaction: Transaction): TransactionResponseDTO {
    return {
      createdAt: transaction.getCreatedAt().valueOf(),
      description: transaction.description,
      entries: transaction
        .getEntries()
        .map((entry) => EntryMapper.toResponseDTO(entry)),
      id: transaction.getId().valueOf(),
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
      updatedAt: transaction.getUpdatedAt().valueOf(),
      userId: transaction.getUserId().valueOf(),
    };
  }
}
