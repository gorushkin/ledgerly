import { ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import {
  createdAt,
  description,
  updatedAt,
  id,
  isTombstone,
  getMoneyColumn,
  getBooleanColumn,
} from './common';
import { usersTable } from './users';

export const accountsTable = sqliteTable(
  'accounts',
  {
    createdAt,
    // Foreign key constraint to the currencies table has been removed.
    // This allows invalid currency codes to be inserted, which may improve test performance,
    // but creates a risk of data inconsistency in production.
    // Consider implementing application-level validation for currency codes.
    currency: text('currency').notNull().$type<CurrencyCode>(),
    currentClearedBalanceLocal: getMoneyColumn('current_cleared_balance_local'),
    description,
    id,
    initialBalance: getMoneyColumn('initial_balance'),
    isSystem: getBooleanColumn('is_system'),
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
