import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, uuid } from './common';

export const transactions1 = sqliteTable('transactions', {
  comment: text('comment'),
  created_at: text('created_at').notNull(),
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  posted_at: text('posted_at'),
});

export const transactions = sqliteTable('transactions', {
  createdAt,
  description,
  id: uuid,
  postingDate: text('posting_date').notNull(), // ISO: YYYY-MM-DD
  transactionDate: text('transaction_date').notNull(), // ISO: YYYY-MM-DD
  updatedAt,
});
