import { REQUIRED_USER_OPERATIONS_PER_ENTRY } from '@ledgerly/shared/constants';
import { EntryWithOperations } from 'src/db/schema';
import { Entry } from 'src/domain/entries/entry.entity';

import { Transaction } from '../../domain/transactions';
import { EntryResponseDTO, TransactionResponseDTO } from '../dto';

import { EntryMapper } from './entry.mapper';

export type TransactionMapperInterface = {
  toResponseDTO(
    transaction: Transaction,
    entriesData?: EntryWithOperations[],
  ): TransactionResponseDTO;

  mapEntryData(entryData: EntryWithOperations): EntryResponseDTO;

  mapEntry(entry: Entry): EntryResponseDTO;
};

export class TransactionMapper implements TransactionMapperInterface {
  toResponseDTO(
    transaction: Transaction,
    entriesData?: EntryWithOperations[],
  ): TransactionResponseDTO {
    const entries = entriesData
      ? entriesData.map((entry) => this.mapEntryData(entry))
      : transaction.getEntries().map((entry) => this.mapEntry(entry));

    return {
      createdAt: transaction.getCreatedAt().valueOf(),
      description: transaction.description,
      entries,
      id: transaction.getId().valueOf(),
      postingDate: transaction.getPostingDate().valueOf(),
      transactionDate: transaction.getTransactionDate().valueOf(),
      updatedAt: transaction.getUpdatedAt().valueOf(),
      userId: transaction.getUserId().valueOf(),
    };
  }

  mapEntryData(entryData: EntryWithOperations): EntryResponseDTO {
    const userOperations = entryData.operations
      .filter((operation) => !operation.isSystem)
      .map((operation) => {
        return {
          accountId: operation.accountId,
          amount: operation.amount,
          createdAt: operation.createdAt,
          description: operation.description,
          entryId: operation.entryId,
          id: operation.id,
          isSystem: operation.isSystem,
          updatedAt: operation.updatedAt,
          userId: operation.userId,
        };
      });

    if (userOperations.length !== REQUIRED_USER_OPERATIONS_PER_ENTRY) {
      throw new Error(
        `Entry ${entryData.id} must have exactly ${REQUIRED_USER_OPERATIONS_PER_ENTRY} user operations for response DTO, found ${userOperations.length}`,
      );
    }

    return {
      createdAt: entryData.createdAt,
      id: entryData.id,
      isTombstone: entryData.isTombstone,
      operations: [userOperations[0], userOperations[1]],
      transactionId: entryData.transactionId,
      updatedAt: entryData.updatedAt,
      userId: entryData.userId,
    };
  }

  mapEntry(entry: Entry): EntryResponseDTO {
    return EntryMapper.toResponseDTO(entry);
  }
}
