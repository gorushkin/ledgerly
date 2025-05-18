import { sqliteTable, integer, real, text } from 'drizzle-orm/sqlite-core';

import { accounts } from './accounts';
import { categories } from './categories';
import { transactions } from './transactions';

export const entries = sqliteTable('entries', {
  accountId: text('account_id').references(() => accounts.id),
  amount: real('amount'),
  categoryId: integer('category_id').references(() => categories.id),
  date: text('date'),
  description: text('description'),
  id: integer('id').primaryKey({ autoIncrement: true }),
  transactionId: integer('transaction_id').references(() => transactions.id),
});
