import { ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { commoditiesTable } from './commodities';
import {
  createdAt,
  description,
  updatedAt,
  id,
  isTombstone,
  getAmountColumn,
  isSystem,
} from './common';
import { usersTable } from './users';

export const accountsTable = sqliteTable(
  'accounts',
  {
    commodityId: text('commodity_id')
      .notNull()
      .references(() => commoditiesTable.id)
      .$type<UUID>(),
    createdAt,
    currency: text('currency').notNull().$type<CurrencyCode>(),
    currentClearedBalanceLocal: getAmountColumn(
      'current_cleared_balance_local',
    ),
    description,
    id,
    initialBalance: getAmountColumn('initial_balance'),
    isSystem,
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
