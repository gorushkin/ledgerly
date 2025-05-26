import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

import { accounts } from './accounts';
import { categories } from './categories';
import { uuidPrimary } from './common';
import { transactions } from './transactions';

export const operations = sqliteTable('operations', {
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  amount: real('amount').notNull(),
  categoryId: text('category_id').references(() => categories.id),
  createdAt: text('created_at').notNull().default('CURRENT_TIMESTAMP'),
  description: text('description'),
  id: uuidPrimary,
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id),
});
