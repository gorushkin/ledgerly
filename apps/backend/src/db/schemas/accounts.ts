import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import { UUID } from '@ledgerly/shared/types';
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
  getBooleanColumn,
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
    currentClearedBalanceLocal: getAmountColumn(
      'current_cleared_balance_local',
    ),
    description,
    id,
    initialBalance: getAmountColumn('initial_balance'),
    isClosed: getBooleanColumn('is_closed'),
    isSystem,
    isTombstone,
    name: text('name').notNull(),
    type: text('type', {
      enum: ACCOUNT_TYPES,
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
