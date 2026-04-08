import { UUID } from '@ledgerly/shared/types';
import { TransactionWithRelations } from 'src/db/schema';
import { Transaction } from 'src/domain';

import { OperationRepositoryInterface } from './OperationRepository.interface';

export type TransactionRepositoryInterface = {
  update(userId: UUID, transaction: Transaction): Promise<void>;
  create(userId: UUID, transaction: Transaction): Promise<void>;
  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null>;
  softDelete(userId: UUID, transaction: Transaction): Promise<void>;
  getTransactionSnapshot(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null>;
  readonly operationsRepository: OperationRepositoryInterface;
};
