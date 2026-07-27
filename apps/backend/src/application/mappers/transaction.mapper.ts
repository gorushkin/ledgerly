import { Transaction } from 'src/domain';
import { DateValue } from 'src/domain/domain-core/value-objects/DateValue';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import {
  CreateTransactionProps,
  TransactionBuildContext,
  TransactionUpdateData,
} from 'src/domain/transactions/types';

import { CreateTransactionRequestDTO, TransactionResponseDTO } from '../dto';

import { OperationMapper } from './operation.mapper';

export class TransactionMapper {
  static toResponseDTO(transaction: Transaction): TransactionResponseDTO {
    const snapshot = transaction.toActiveSnapshot();

    return {
      commodityId: snapshot.commodityId,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      operations: snapshot.operations.map((operation) =>
        OperationMapper.toResponseDTOFromSnapshot(operation),
      ),
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      version: snapshot.version,
    };
  }

  static toCreateTransactionProps(
    dto: CreateTransactionRequestDTO,
    context: TransactionBuildContext,
  ): CreateTransactionProps {
    const operations = dto.operations.map((operation) =>
      OperationMapper.toCreateOperationProps(operation, context),
    );

    return {
      commodityId: Id.restore(dto.commodityId),
      description: dto.description,
      operations,
      postingDate: DateValue.restore(dto.postingDate),
      transactionDate: DateValue.restore(dto.transactionDate),
    };
  }

  static toMetadataUpdateData(transaction: Transaction): TransactionUpdateData {
    const snapshot = transaction.toSnapshot();

    return {
      description: snapshot.description,
      postingDate: snapshot.postingDate,
      transactionDate: snapshot.transactionDate,
    };
  }
}
