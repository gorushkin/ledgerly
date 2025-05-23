import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

import { accounts } from './accounts';
import { categories } from './categories';
import { createdAt, description, updatedAt, uuid } from './common';

export const transactions = sqliteTable('transactions', {
  createdAt,
  description,
  id: uuid,
  postingDate: text('posting_date').notNull(),
  transactionDate: text('transaction_date').notNull(),
  updatedAt,
});

export const operations = sqliteTable('operations', {
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  amount: real('amount').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  description: text('description'),
  id: uuid,
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id),
});
