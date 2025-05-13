// import { eq } from 'drizzle-orm';
// import { db } from 'src/db';
import { Account } from '../../../../../packages/shared/types/account';
import type { IAccountRepository } from '../../domain/IAccountRepository';
// import { transactions } from 'src/db/transactions';

export class TransactionRepository implements IAccountRepository {
  getAllAccounts(): Promise<Account[]> {
    throw new Error('Method not implemented.');
  }
  getAccountById(id: number): Promise<Account | null> {
    throw new Error('Method not implemented.');
  }
  createTransaction(data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  updateTransaction(id: number, data: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  deleteTransaction(id: number): Promise<void> {
    throw new Error('Method not implemented.');
  }
  // async getAllTransactions() {
  //   return db.select().from(transactions);
  // }
  // async getTransactionById(id: number) {
  //   return db.select().from(transactions).where(eq(transactions.id, id)).get();
  // }
  // async createTransaction(data: any) {
  //   return db.insert(transactions).values(data).returning();
  // }
  // async updateTransaction(id: number, data: any) {
  //   return db
  //     .update(transactions)
  //     .set(data)
  //     .where(eq(transactions.id, id))
  //     .returning();
  // }
  // async deleteTransaction(id: number) {
  //   await db.delete(transactions).where(eq(transactions.id, id));
  // }
}
