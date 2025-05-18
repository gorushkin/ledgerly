export interface Entry {
  id: number;
  transactionId: number;
  walletId: number;
  categoryId?: number;
  description?: string;
  amount: number;
  currency: string;
  date: string;
}
