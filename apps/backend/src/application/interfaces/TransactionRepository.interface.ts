import { UUID } from '@ledgerly/shared/types';
import { Transaction } from 'src/domain';

import { EntryRepositoryInterface } from './EntryRepository.interface';
import { OperationRepositoryInterface } from './OperationRepository.interface';

export type TransactionRepositoryInterface = {
  rootSave(userId: UUID, transaction: Transaction): Promise<void>;
  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null>;
  delete(userId: UUID, transactionId: UUID): Promise<void>;
  readonly entriesRepository: EntryRepositoryInterface;
  readonly operationsRepository: OperationRepositoryInterface;
};
