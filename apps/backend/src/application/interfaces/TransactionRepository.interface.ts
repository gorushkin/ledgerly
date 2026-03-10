import { UUID } from '@ledgerly/shared/types';
import { Transaction } from 'src/domain';

import { OperationRepositoryInterface } from './OperationRepository.interface';

export type TransactionRepositoryInterface = {
  rootSave(userId: UUID, transaction: Transaction): Promise<void>;
  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null>;
  delete(userId: UUID, transactionId: UUID): Promise<void>;
  readonly operationsRepository: OperationRepositoryInterface;
};
