import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

// Описание таблицы transactions
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  comment: text("comment"),
  created_at: text("created_at").notNull(), // Дата перевода
  posted_at: text("posted_at"), // Дата зачисления (может быть null)
});
