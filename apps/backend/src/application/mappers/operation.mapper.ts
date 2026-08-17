import { Amount, Id } from 'src/domain/domain-core';
import { AccountNotFoundInContextError } from 'src/domain/domain.errors';
import { Operation } from 'src/domain/operations/operation.entity';
import {
  CreateOperationProps,
  OperationSnapshot,
  UpdateOperationProps,
} from 'src/domain/operations/types';
import { TransactionBuildContext } from 'src/domain/transactions/types';

import {
  CreateOperationRequestDTO,
  OperationResponseDTO,
  UpdateOperationRequestDTO,
} from '../dto';

export class OperationMapper {
  static toResponseDTO(operation: Operation): OperationResponseDTO {
    const snapshot = operation.toSnapshot();

    return OperationMapper.toResponseDTOFromSnapshot(snapshot);
  }

  /**
   * @internal Maps trusted domain snapshots produced by Operation/Transaction
   * entities. Do not use this as a validation boundary for external input or
   * raw persistence data.
   */
  static toResponseDTOFromSnapshot(
    snapshot: OperationSnapshot,
  ): OperationResponseDTO {
    return {
      accountId: snapshot.accountId,
      amount: snapshot.amount,
      createdAt: snapshot.createdAt,
      description: snapshot.description,
      id: snapshot.id,
      transactionId: snapshot.transactionId,
      updatedAt: snapshot.updatedAt,
      userId: snapshot.userId,
      value: snapshot.value,
    };
  }

  static toCreateOperationProps(
    dto: CreateOperationRequestDTO,
    context: TransactionBuildContext,
  ): CreateOperationProps {
    const account = context.accountsMap.get(dto.accountId);

    if (!account) {
      throw new AccountNotFoundInContextError(dto.accountId, 'new-operation');
    }

    return {
      account: account,
      amount: Amount.create(dto.amount),
      description: dto.description,
      value: Amount.create(dto.value),
    };
  }

  static toUpdateOperationProps(
    dto: UpdateOperationRequestDTO,
    context: TransactionBuildContext,
  ): UpdateOperationProps {
    const account = context.accountsMap.get(dto.accountId);

    if (!account) {
      throw new AccountNotFoundInContextError(dto.accountId, dto.id);
    }

    return {
      account: account,
      amount: Amount.create(dto.amount),
      description: dto.description,
      id: Id.restore(dto.id),
      value: Amount.create(dto.value),
    };
  }
}
