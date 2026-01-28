import { REQUIRED_USER_OPERATIONS_PER_ENTRY } from '@ledgerly/shared/constants';
import { EntrySnapshot } from 'src/domain/entries/types';
import { TransactionSnapshot } from 'src/domain/transactions/types';

import {
  EntryOperationsResponseDTO,
  EntryResponseDTO,
  TransactionResponseDTO,
} from '../dto';

export type TransactionMapperInterface = {
  toResponseDTO(transaction: TransactionSnapshot): TransactionResponseDTO;
  mapEntryData(entryData: EntrySnapshot): EntryResponseDTO;
  mapOperationData(entryData: EntrySnapshot): EntryOperationsResponseDTO;
};

export class TransactionMapper implements TransactionMapperInterface {
  mapOperationData(entryData: EntrySnapshot): EntryOperationsResponseDTO {
    const operations = entryData.operations
      .filter((operation) => !operation.isSystem)
      .map((operation) => ({
        accountId: operation.accountId,
        amount: operation.amount,
        createdAt: operation.createdAt,
        description: operation.description,
        entryId: operation.entryId,
        id: operation.id,
        isSystem: operation.isSystem,
        updatedAt: operation.updatedAt,
        userId: operation.userId,
      }));

    if (operations.length !== REQUIRED_USER_OPERATIONS_PER_ENTRY) {
      throw new Error(
        `Entry ${entryData.id} must have exactly ${REQUIRED_USER_OPERATIONS_PER_ENTRY} user operations for response DTO, found ${operations.length}`,
      );
    }

    return [operations[0], operations[1]];
  }

  toResponseDTO(transaction: TransactionSnapshot): TransactionResponseDTO {
    return {
      createdAt: transaction.createdAt,
      description: transaction.description,
      entries: transaction.entries.map((entry) => this.mapEntryData(entry)),
      id: transaction.id,
      postingDate: transaction.postingDate,
      transactionDate: transaction.transactionDate,
      updatedAt: transaction.updatedAt,
      userId: transaction.userId,
    };
  }

  mapEntryData(entryData: EntrySnapshot): EntryResponseDTO {
    const operations = this.mapOperationData(entryData);

    return {
      createdAt: entryData.createdAt,
      description: entryData.description,
      id: entryData.id,
      isTombstone: entryData.isTombstone,
      operations: [operations[0], operations[1]],
      transactionId: entryData.transactionId,
      updatedAt: entryData.updatedAt,
      userId: entryData.userId,
    };
  }
}
