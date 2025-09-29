import { ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex, real } from 'drizzle-orm/sqlite-core';

import {
  createdAt,
  description,
  updatedAt,
  id,
  isTombstone,
  getBooleanColumn,
} from './common';
import { currenciesTable } from './currencies';
import { usersTable } from './users';

export const accountsTable = sqliteTable(
  'accounts',
  {
    createdAt,
    currency: text('currency')
      .notNull()
      .references(() => currenciesTable.code)
      .$type<CurrencyCode>(),
    currentClearedBalanceLocal: real('current_cleared_balance_local').notNull(),
    description,
    id,
    initialBalance: real('initial_balance').notNull(),
    isArchived: getBooleanColumn('is_archived'),
    isTombstone,
    name: text('name').notNull(),
    type: text('type', {
      enum: ACCOUNT_TYPE_VALUES,
    }).notNull(),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
  },
  (table) => [
    uniqueIndex('user_id_name_unique_idx').on(table.userId, table.name),
  ],
);

export type AccountDbRow = InferSelectModel<typeof accountsTable>;
export type AccountDbInsert = InferInsertModel<typeof accountsTable>;

export type AccountRepoInsert = AccountDbInsert;

export type AccountDbUpdate = Partial<
  Omit<
    AccountDbRow,
    'id' | 'userId' | 'createdAt' | 'updatedAt' | 'isTombstone'
  >
>;
