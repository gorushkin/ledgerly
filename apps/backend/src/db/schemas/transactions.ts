import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, uuidPrimary } from './common';
import { users } from './users';

export const transactions = sqliteTable('transactions', {
  createdAt,
  description,
  id: uuidPrimary,
  postingDate: text('posting_date').notNull(),
  transactionDate: text('transaction_date').notNull(),
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
});
