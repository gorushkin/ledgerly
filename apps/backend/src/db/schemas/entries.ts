import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { transactionsTable, usersTable } from '../schema';

import { id, description, createdAt, updatedAt } from './common';

export const entriesTable = sqliteTable(
  'entries',
  {
    createdAt,
    description,
    id,
    index: integer('index').notNull(),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactionsTable.id, { onDelete: 'cascade' }),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('idx_entries_tx').on(t.transactionId),
    index('idx_entries_tx_index').on(t.transactionId, t.index),
  ],
);
