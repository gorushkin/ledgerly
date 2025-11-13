import { TransactionQueryParams, UUID } from '@ledgerly/shared/types';
import {
  TransactionRepoInsert,
  TransactionDbRow,
  TransactionWithRelations,
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
};
