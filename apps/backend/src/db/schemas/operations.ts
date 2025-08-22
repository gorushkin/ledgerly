import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, index } from 'drizzle-orm/sqlite-core';

import { accountsTable } from './accounts';
import {
  description,
  createdAt,
  updatedAt,
  hash,
  isTombstone,
  id,
  getMoneyColumn,
} from './common';
import { transactionsTable } from './transactions';
import { usersTable } from './users';

export const operationsTable = sqliteTable(
  'operations',
  {
    accountId: text('account_id')
      .notNull()
      .references(() => accountsTable.id, { onDelete: 'restrict' }),
    baseAmount: getMoneyColumn('base_amount'),
    createdAt,
    description,
    hash,
    id,
    isTombstone,
    localAmount: getMoneyColumn('local_amount'),
    rateBasePerLocal: getMoneyColumn('rate_base_per_local'),
    transactionId: text('transaction_id')
      .notNull()
      .references(() => transactionsTable.id, { onDelete: 'cascade' }),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (t) => [
    index('idx_operations_tx').on(t.transactionId),
    index('idx_operations_account').on(t.accountId),
    index('idx_operations_user').on(t.userId),
    index('idx_operations_tx_hash').on(t.transactionId, t.hash),
  ],
);

export type OperationDbRow = InferSelectModel<typeof operationsTable>;
export type OperationDbInsert = InferInsertModel<typeof operationsTable>;

export type OperationRepoInsert = Omit<
  OperationDbInsert,
  'id' | 'createdAt' | 'updatedAt'
>;

export type OperationDbUpdate = Partial<
  Omit<
    OperationDbRow,
    'id' | 'userId' | 'transactionId' | 'createdAt' | 'updatedAt' | 'hash'
  >
>;
