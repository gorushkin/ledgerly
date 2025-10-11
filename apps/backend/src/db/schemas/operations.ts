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
  getBooleanColumn,
  getMoneyColumn,
} from './common';
import { entriesTable } from './entries';
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
    entryId: text('entry_id')
      .notNull()
      .references(() => entriesTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
    id,
    isSystem: getBooleanColumn('is_system'),
    isTombstone,
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
  },
  (t) => [
    index('idx_operations_entry').on(t.entryId),
    index('idx_operations_account').on(t.accountId),
    index('idx_operations_user').on(t.userId),
  ],
);

export type OperationDbRow = InferSelectModel<typeof operationsTable>;
export type OperationDbInsert = InferInsertModel<typeof operationsTable>;

export type OperationRepoInsert = Omit<
  OperationDbInsert,
  'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isTombstone'
>;

export type OperationDbUpdate = Partial<
  Omit<
    OperationDbRow,
    | 'id'
    | 'userId'
    | 'transactionId'
    | 'createdAt'
    | 'updatedAt'
    | 'isTombstone'
  >
>;
