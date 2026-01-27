import { UUID } from '@ledgerly/shared/types';
import { Transaction } from 'src/domain';

export type TransactionRepositoryInterface = {
  create(transaction: Transaction): Promise<void>;
  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null>;
  // TODO: replace with save
  update(transaction: Transaction): Promise<void>;
  delete(userId: UUID, transactionId: UUID): Promise<void>;
};
