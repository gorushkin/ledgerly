import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import {
  hash,
  createdAt,
  description,
  updatedAt,
  isTombstone,
  id,
} from './common';
import { usersTable } from './users';

export const transactionsTable = sqliteTable('transactions', {
  createdAt,
  description,
  hash,
  id,
  isTombstone,
  postingDate: text('posting_date').notNull(),
  transactionDate: text('transaction_date').notNull(),
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export type TransactionDbRow = InferSelectModel<typeof transactionsTable>;
export type TransactionDbInsert = InferInsertModel<typeof transactionsTable>;
