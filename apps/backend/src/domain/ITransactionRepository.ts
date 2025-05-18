export interface ITransactionRepository {
  createTransaction(data: unknown): Promise<unknown>;
  updateTransaction(id: number, data: unknown): Promise<unknown>;
  deleteTransaction(id: number): Promise<void>;
  getAllTransactions(): Promise<unknown[]>;
  getTransactionById(id: number): Promise<unknown>;
}
