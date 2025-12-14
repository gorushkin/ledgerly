import { UUID } from '@ledgerly/shared/types';
import {
  TransactionRepoInsert,
  TransactionDbRow,
  TransactionDbUpdate,
} from 'src/db/schema';
import { Transaction } from 'src/domain';

export type TransactionRepositoryInterface = {
  create(data: TransactionRepoInsert): Promise<TransactionDbRow>;
  getById(userId: UUID, transactionId: UUID): Promise<Transaction | null>;
  update(
    userId: UUID,
    transactionId: UUID,
    data: TransactionDbUpdate,
  ): Promise<TransactionDbRow>;
  delete(userId: UUID, transactionId: UUID): Promise<void>;
};
