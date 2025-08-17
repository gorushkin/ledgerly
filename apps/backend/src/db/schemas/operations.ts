import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

import { accountsTable } from './accounts';
import {
  description,
  createdAt,
  updatedAt,
  hash,
  isTombstone,
  uuid,
} from './common';
import { transactionsTable } from './transactions';
import { usersTable } from './users';

export const operationsTable = sqliteTable(
  'operations',
  {
    accountId: text('account_id')
      .notNull()
      .references(() => accountsTable.id, { onDelete: 'restrict' }),
    baseAmount: integer('base_amount').notNull(),
    createdAt,
    description,
    hash,
    id: uuid,
    isTombstone,
    localAmount: integer('local_amount'),
    rateBasePerLocal: text('rate_base_per_local'),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactionsTable.id, { onDelete: 'cascade' }),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('idx_operations_tx').on(t.transactionId),
    index('idx_operations_account').on(t.accountId),
    index('idx_operations_user').on(t.userId),
    index('idx_operations_tx_hash').on(t.transactionId, t.hash),
  ],
);
