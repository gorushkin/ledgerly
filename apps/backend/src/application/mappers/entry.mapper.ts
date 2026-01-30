import { REQUIRED_USER_OPERATIONS_PER_ENTRY } from '@ledgerly/shared/constants';
import { EntryRepoInsert } from 'src/db/schema';
import { Entry } from 'src/domain';

import { EntryResponseDTO, OperationResponseDTO } from '../dto';

import { OperationMapper } from './operation.mapper';

export class EntryMapper {
  static toResponseDTO(entry: Entry): EntryResponseDTO {
    const snapshot = entry.toSnapshot();

    const operations = this.getOperationsForResponseDTO(entry);

    return {
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      operations,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
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

  static toDBRow(entry: Entry): EntryRepoInsert {
    const snapshot = entry.toSnapshot();

    return {
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      isTombstone: snapshot.isTombstone,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
    };
  }
}
