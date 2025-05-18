import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const transactions = sqliteTable('transactions', {
  comment: text('comment'),
  created_at: text('created_at').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  posted_at: text('posted_at'),
});
