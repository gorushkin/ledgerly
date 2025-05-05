import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const accounts = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  currency_code: text("currency_code").notNull(), // Пример: 'USD', 'RUB'
  type: text("type").notNull().default("budget"), // Пример: 'budget', 'non-budget'
});
