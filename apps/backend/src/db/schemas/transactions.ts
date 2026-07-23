import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { commoditiesTable, OperationDbRow, operationsTable } from '../schema';

import {
  createdAt,
  description,
  updatedAt,
  isTombstone,
  id,
  getIsoDateString,
  version,
} from './common';
import { usersTable } from './users';

export const transactionsTable = sqliteTable(
  'transactions',
  {
    commodityId: text('commodity_id')
      .notNull()
      .references(() => commoditiesTable.id)
      .$type<UUID>(),
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
    version,
  },

  (t) => [index('idx_transactions_user_date').on(t.userId, t.transactionDate)],
);

// TODO: check if relations are needed for operations, or if they can be accessed through entries and transactions instead
export const transactionsRelations = relations(
  transactionsTable,
  ({ many }) => ({
    operations: many(operationsTable),
  }),
);

export type TransactionDbRow = InferSelectModel<typeof transactionsTable>;
export type TransactionDbInsert = InferInsertModel<typeof transactionsTable>;

export type TransactionRepoInsert = TransactionDbInsert;

export type TransactionDbUpdate = Partial<
  Omit<TransactionDbRow, 'id' | 'userId' | 'createdAt'>
>;

// Type for transaction with nested relations (operations as array)
export type TransactionWithRelations = TransactionDbRow & {
  operations: OperationDbRow[];
};

// Type for transaction with nested relations (operations as tuple of 2)
export type TransactionWithTwoOperationsPerEntry = TransactionDbRow & {
  operations: OperationDbRow[];
};
