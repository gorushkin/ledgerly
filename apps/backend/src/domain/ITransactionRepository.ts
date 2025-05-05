export interface ITransactionRepository {
  getAllTransactions(): Promise<any[]>;
  getTransactionById(id: number): Promise<any | null>;
  createTransaction(data: any): Promise<any>;
  updateTransaction(id: number, data: any): Promise<any>;
  deleteTransaction(id: number): Promise<void>;
}
