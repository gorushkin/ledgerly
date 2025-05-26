import { TransactionCreateDTO } from '@ledgerly/shared/types';

import { BaseRepository } from './BaseRepository';

export class TransactionRepository extends BaseRepository {
  getAllTransactions(): Promise<unknown[]> {
    throw new Error('Method not implemented.');
  }
  getTransactionById(_id: number): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  getAllAccounts(): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  getAccountById(_id: number): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  createTransaction(dto: TransactionCreateDTO): Promise<unknown> {
    console.info('dto: ', dto);
    throw new Error('Method not implemented.');
  }
  updateTransaction(_id: number, _data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  deleteTransaction(_id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export const transactionRepository = new TransactionRepository();
