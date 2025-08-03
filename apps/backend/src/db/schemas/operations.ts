import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

import { accountsTable } from './accounts';
import { categories } from './categories';
import {
  description,
  createdAt,
  updatedAt,
  clientGeneratedId,
  hash,
  isTombstone,
} from './common';
import { transactionsTable } from './transactions';
import { usersTable } from './users';

export const operationsTable = sqliteTable('operations', {
  accountId: text('account_id')
    .notNull()
    .references(() => accountsTable.id),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  createdAt,
  description,
  hash,
  id: clientGeneratedId,
  isTombstone,
  localAmount: real('local_amount').notNull(),
  originalAmount: real('original_amount').notNull(),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactionsTable.id, { onDelete: 'cascade' }),
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id, { onDelete: 'cascade' }),
});
