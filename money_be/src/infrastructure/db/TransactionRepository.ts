import { eq.  } from "drizzle-orm";
import { db } from "src/db";
import { ITransactionRepository } from "../../domain/ITransactionRepository";
import { transactions } from "src/db/transactions";

export class TransactionRepository implements ITransactionRepository {
  async getAllTransactions() {
    return db.select().from(transactions);
  }

  async getTransactionById(id: number) {
    return db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .get();
  }

  async createTransaction(data: any) {
    return db.insert(transactions).values(data).returning();
  }

  async updateTransaction(id: number, data: any) {
    return db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
  }

  async deleteTransaction(id: number) {
    await db.delete(transactions).where(eq(transactions.id, id));
  }
}
