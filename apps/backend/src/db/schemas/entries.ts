import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
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
      .references(() => transactionsTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
  },
  (t) => [index('idx_entries_tx').on(t.transactionId)],
);

export type EntryDbRow = InferSelectModel<typeof entriesTable>;

export type EntryDbInsert = InferInsertModel<typeof entriesTable>;

export type EntryRepoInsert = EntryDbInsert;
