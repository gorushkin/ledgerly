import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import {
  TransactionRepoInsert,
  TransactionDbRow,
  TransactionWithRelations,
  TransactionDbUpdate,
} from 'src/db/schema';

export type TransactionRepositoryInterface = {
  create(data: TransactionRepoInsert): Promise<TransactionDbRow>;
  getById(
    userId: UUID,
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null>;
  getAll(
    userId: UUID,
    query?: TransactionQueryParams,
  ): Promise<TransactionWithRelations[]>;
  update(
    userId: UUID,
    transactionId: UUID,
    data: TransactionDbUpdate,
  ): Promise<TransactionDbRow>;
  delete(userId: UUID, transactionId: UUID): Promise<void>;
};
