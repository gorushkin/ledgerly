import { REQUIRED_USER_OPERATIONS_PER_ENTRY } from '@ledgerly/shared/constants';
import { Entry } from 'src/domain/entries';

import { EntryResponseDTO, OperationResponseDTO } from '../dto';

import { OperationMapper } from './operation.mapper';

export class EntryMapper {
  static toResponseDTO(entry: Entry): EntryResponseDTO {
    const operations = this.getOperationsForResponseDTO(entry);

    return {
      createdAt: entry.getCreatedAt().valueOf(),
      description: entry.description,
      id: entry.getId().valueOf(),
      isTombstone: entry.isDeleted(),
      operations,
      transactionId: entry.getTransactionId().valueOf(),
      updatedAt: entry.getUpdatedAt().valueOf(),
      userId: entry.toPersistence().userId,
    };
  }

  private static getOperationsForResponseDTO(
    entry: Entry,
  ): [OperationResponseDTO, OperationResponseDTO] {
    const operations = entry
      .getOperations()
      .reduce((acc: OperationResponseDTO[], operation) => {
        if (operation.isSystem) {
          return acc;
        }

        acc.push(OperationMapper.toResponseDTO(operation));
        return acc;
      }, []);

    if (operations.length !== REQUIRED_USER_OPERATIONS_PER_ENTRY) {
      throw new Error(
        `Entry ${entry.getId().valueOf()} must have exactly two non-system operations for response DTO, found ${operations.length}`,
      );
    }

    return [operations[0], operations[1]];
  }
}
