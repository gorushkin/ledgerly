import { TransactionDbRow } from 'src/db/schema';
import { Transaction } from 'src/domain';
import { Currency } from 'src/domain/domain-core/value-objects/Currency';
import { DateValue } from 'src/domain/domain-core/value-objects/DateValue';
import {
  CreateTransactionProps,
  TransactionBuildContext,
  TransactionUpdateData,
} from 'src/domain/transactions/types';

import { CreateTransactionRequestDTO, TransactionResponseDTO } from '../dto';

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

  static toCreateTransactionProps(
    dto: CreateTransactionRequestDTO,
    context: TransactionBuildContext,
  ): CreateTransactionProps {
    const operations = dto.operations.map((operation) =>
      OperationMapper.toCreateOperationProps(operation, context),
    );

    return {
      currency: Currency.create(dto.currencyCode),
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
