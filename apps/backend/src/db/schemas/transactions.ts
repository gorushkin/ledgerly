import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import {
  clientGeneratedId,
  hash,
  createdAt,
  description,
  updatedAt,
  isTombstone,
} from './common';
import { usersTable } from './users';

export const transactionsTable = sqliteTable('transactions', {
  createdAt,
  description,
  hash,
  id: clientGeneratedId,
  isTombstone,
  postingDate: text('posting_date').notNull(),
  transactionDate: text('transaction_date').notNull(),
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});
