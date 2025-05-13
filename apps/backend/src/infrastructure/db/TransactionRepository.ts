import { ITransactionRepository } from 'src/domain/ITransactionRepository';

export class TransactionRepository implements ITransactionRepository {
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
  createTransaction(_data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  updateTransaction(_id: number, _data: unknown): Promise<unknown> {
    throw new Error('Method not implemented.');
  }
  deleteTransaction(_id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
}
