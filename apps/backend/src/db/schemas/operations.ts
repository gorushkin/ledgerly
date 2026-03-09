import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
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
    amount: getMoneyColumn('base_amount'),
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
    value: getMoneyColumn('base_amount'),
  },
  (t) => [
    index('idx_operations_transaction').on(t.transactionId),
    index('idx_operations_account').on(t.accountId),
    index('idx_operations_user').on(t.userId),
  ],
);

export type OperationDbRow = InferSelectModel<typeof operationsTable>;
export type OperationDbInsert = InferInsertModel<typeof operationsTable>;

export type OperationRepoInsert = OperationDbInsert;
