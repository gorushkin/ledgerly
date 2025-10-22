import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { transactionsTable, usersTable } from '../schema';

import { id, createdAt, updatedAt } from './common';

export const entriesTable = sqliteTable(
  'entries',
  {
    createdAt,
    id,
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactionsTable.id, { onDelete: 'cascade' }),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (t) => [index('idx_entries_tx').on(t.transactionId)],
);
