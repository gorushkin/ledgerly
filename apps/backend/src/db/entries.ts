import { sqliteTable, integer, real, text } from "drizzle-orm/sqlite-core";
import { transactions } from "./transactions";
import { accounts } from "./accounts";
import { categories } from "./categories";

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  description: text("description"),
  amount: real("amount"),
  date: text("date"),
  categoryId: integer("category_id").references(() => categories.id),
  transactionId: integer("transaction_id").references(() => transactions.id),
  walletId: integer("wallet_id").references(() => accounts.id),
});
