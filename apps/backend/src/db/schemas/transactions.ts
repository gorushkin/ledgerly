import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import {
  createdAt,
  description,
  updatedAt,
  isTombstone,
  id,
  getIsoDateString,
} from './common';
import { usersTable } from './users';

export const transactionsTable = sqliteTable('transactions', {
  createdAt,
  description,
  id,
  isTombstone,
  postingDate: getIsoDateString('posting_date'),
  transactionDate: getIsoDateString('transaction_date'),
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});

export type TransactionDbRow = InferSelectModel<typeof transactionsTable>;
export type TransactionDbInsert = InferInsertModel<typeof transactionsTable>;

export type TransactionRepoInsert = Omit<
  TransactionDbInsert,
  'id' | 'createdAt' | 'updatedAt'
>;

export type TransactionDbUpdate = Partial<
  Omit<TransactionDbRow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;
