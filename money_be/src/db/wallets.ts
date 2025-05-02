import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const wallets = sqliteTable("wallets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  currency_code: text("currency_code").notNull(), // Пример: 'USD', 'RUB'
});
