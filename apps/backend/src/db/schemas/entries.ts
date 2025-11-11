import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { transactionsTable, usersTable } from '../schema';

import { id, createdAt, updatedAt } from './common';
import { operationsTable } from './operations';
import type { OperationDbRow } from './operations';

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

export const entriesRelations = relations(entriesTable, ({ many, one }) => ({
  operations: many(operationsTable),
  transaction: one(transactionsTable, {
    fields: [entriesTable.transactionId],
    references: [transactionsTable.id],
  }),
}));

export type EntryDbRow = InferSelectModel<typeof entriesTable>;

export type EntryDbInsert = InferInsertModel<typeof entriesTable>;

export type EntryRepoInsert = EntryDbInsert;

// Type for entry with nested operations (array of operations)
export type EntryWithOperations = EntryDbRow & {
  operations: OperationDbRow[];
};

// Type for entry with exactly 2 operations (tuple)
export type EntryWithTwoOperations = EntryDbRow & {
  operations: [OperationDbRow, OperationDbRow];
};
