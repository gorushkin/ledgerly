import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { foreignKey, index, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { accountsTable } from './accounts';
import {
  description,
  createdAt,
  updatedAt,
  isTombstone,
  id,
  getAmountColumn,
  isSystem,
} from './common';
import { transactionsTable } from './transactions';
import { usersTable } from './users';

export const operationsTable = sqliteTable(
  'operations',
  {
    accountId: text('account_id').notNull().$type<UUID>(),
    amount: getAmountColumn('amount'),
    createdAt,
    description,
    id,
    isSystem,
    isTombstone,
    transactionId: text('transaction_id').notNull().$type<UUID>(),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
    value: getAmountColumn('value'),
  },
  (table) => [
    foreignKey({
      columns: [table.userId, table.accountId],
      foreignColumns: [accountsTable.userId, accountsTable.id],
      name: 'operations_user_id_account_id_accounts_user_id_id_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.userId, table.transactionId],
      foreignColumns: [transactionsTable.userId, transactionsTable.id],
      name: 'operations_user_id_transaction_id_transactions_user_id_id_fk',
    }).onDelete('cascade'),
    index('idx_operations_transaction').on(table.transactionId),
    index('idx_operations_account').on(table.accountId),
    index('idx_operations_user').on(table.userId),
  ],
);

// TODO: check if relations are needed for operations, or if they can be accessed through entries and transactions instead
export const operationsRelations = relations(operationsTable, ({ one }) => ({
  transaction: one(transactionsTable, {
    fields: [operationsTable.userId, operationsTable.transactionId],
    references: [transactionsTable.userId, transactionsTable.id],
  }),
}));

export type OperationDbRow = InferSelectModel<typeof operationsTable>;
export type OperationDbInsert = InferInsertModel<typeof operationsTable>;

export type OperationRepoInsert = OperationDbInsert;
