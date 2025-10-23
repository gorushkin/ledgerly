import { TxType, DataBase } from 'src/db';
import { TransactionRepoInsert, TransactionDbRow } from 'src/db/schema';

export type TransactionRepositoryInterface = {
  //   save(transaction: Transaction): Promise<Transaction>;
  //   getById(userId: UUID, id: UUID): Promise<Transaction | null>;
  //   getAllByUserId(
  //     userId: UUID,
  //     limit?: number,
  //     offset?: number,
  //   ): Promise<Transaction[]>;
  //   delete(userId: UUID, id: UUID): Promise<boolean>;
  //   exists(userId: UUID, id: UUID): Promise<boolean>;
  create(data: TransactionRepoInsert, tx: TxType): Promise<TransactionDbRow>;
  getDB(): DataBase;
};
