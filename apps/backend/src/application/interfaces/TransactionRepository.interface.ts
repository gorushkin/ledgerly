import { UUID } from '@ledgerly/shared/types';
import { Transaction } from 'src/domain';
import { Version } from 'src/domain/domain-core';

import { OperationRepositoryInterface } from './OperationRepository.interface';

export type TransactionUpdateResult =
  | { ok: true }
  | { ok: false; reason: 'NOT_FOUND' | 'VERSION_CONFLICT' };

export type TransactionRepositoryInterface = {
  update(
    userId: UUID,
    transaction: Transaction,
    expectedVersion: Version,
  ): Promise<TransactionUpdateResult>;
  create(userId: UUID, transaction: Transaction): Promise<void>;
  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null>;
  softDelete(userId: UUID, transaction: Transaction): Promise<void>;
  readonly operationsRepository: OperationRepositoryInterface;
};
