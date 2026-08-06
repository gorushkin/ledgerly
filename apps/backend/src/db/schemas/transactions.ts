import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import {
  foreignKey,
  index,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

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
    commodityId: text('commodity_id').notNull().$type<UUID>(),
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

  (table) => [
    foreignKey({
      columns: [table.userId, table.commodityId],
      foreignColumns: [commoditiesTable.userId, commoditiesTable.id],
      name: 'transactions_user_id_commodity_id_commodities_user_id_id_fk',
    }),
    index('idx_transactions_user_date').on(table.userId, table.transactionDate),
    uniqueIndex('transactions_user_id_id_unique_idx').on(
      table.userId,
      table.id,
    ),
  ],
);

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
