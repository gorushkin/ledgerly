import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

import { accountsTable } from './accounts';
import {
  description,
  createdAt,
  updatedAt,
  isTombstone,
  id,
  getMoneyColumn,
  isSystem,
} from './common';
import { transactionsTable } from './transactions';
import { usersTable } from './users';

export const operationsTable = sqliteTable(
  'operations',
  {
    accountId: text('account_id')
      .notNull()
      .references(() => accountsTable.id, { onDelete: 'restrict' })
      .$type<UUID>(),
    amount: getMoneyColumn('amount'),
    createdAt,
    description,
    id,
    isSystem,
    isTombstone,
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactionsTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
    value: getMoneyColumn('value'),
  },
  (t) => [
    index('idx_operations_transaction').on(t.transactionId),
    index('idx_operations_account').on(t.accountId),
    index('idx_operations_user').on(t.userId),
  ],
);

// TODO: check if relations are needed for operations, or if they can be accessed through entries and transactions instead
export const operationsRelations = relations(operationsTable, ({ one }) => ({
  transaction: one(transactionsTable, {
    fields: [operationsTable.transactionId],
    references: [transactionsTable.id],
  }),
}));

export type OperationDbRow = InferSelectModel<typeof operationsTable>;
export type OperationDbInsert = InferInsertModel<typeof operationsTable>;

export type OperationRepoInsert = OperationDbInsert;
