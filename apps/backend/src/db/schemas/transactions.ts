import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import {
  createdAt,
  description,
  updatedAt,
  isTombstone,
  id,
  getIsoDateString,
} from './common';
import { entriesTable } from './entries';
import type { EntryWithOperations, EntryWithTwoOperations } from './entries';
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
    .references(() => usersTable.id, { onDelete: 'cascade' })
    .$type<UUID>(),
});

export const transactionsRelations = relations(
  transactionsTable,
  ({ many }) => ({
    entries: many(entriesTable),
  }),
);

export type TransactionDbRow = InferSelectModel<typeof transactionsTable>;
export type TransactionDbInsert = InferInsertModel<typeof transactionsTable>;

export type TransactionRepoInsert = TransactionDbInsert;

export type TransactionDbUpdate = Partial<
  Omit<TransactionDbRow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;

// Type for transaction with nested relations (operations as array)
export type TransactionWithRelations = TransactionDbRow & {
  entries: EntryWithOperations[];
};

// Type for transaction with nested relations (operations as tuple of 2)
export type TransactionWithTwoOperationsPerEntry = TransactionDbRow & {
  entries: EntryWithTwoOperations[];
};
