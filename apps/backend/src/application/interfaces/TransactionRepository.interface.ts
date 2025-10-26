import { TransactionRepoInsert, TransactionDbRow } from 'src/db/schema';

export type TransactionRepositoryInterface = {
  create(data: TransactionRepoInsert): Promise<TransactionDbRow>;
};
