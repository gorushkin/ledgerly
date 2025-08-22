import { ACCOUNT_TYPES, ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { CurrencyCode } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text, uniqueIndex, real } from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, id } from './common';
import { currenciesTable } from './currencies';
import { usersTable } from './users';

export const accountsTable = sqliteTable(
  'accounts',
  {
    createdAt,
    currentClearedBalanceLocal: real('current_cleared_balance_local').notNull(),
    description,
    id: id,
    initialBalance: real('initial_balance').notNull(),
    name: text('name').notNull(),
    originalCurrency: text('original_currency')
      .notNull()
      .references(() => currenciesTable.code)
      .$type<CurrencyCode>(),
    type: text('type', {
      enum: ACCOUNT_TYPE_VALUES,
    })
      .notNull()
      .default(ACCOUNT_TYPES[0]),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('user_id_name_unique_idx').on(table.userId, table.name),
  ],
);

export type AccountDbRow = InferSelectModel<typeof accountsTable>;
export type AccountDbInsert = InferInsertModel<typeof accountsTable>;

export type AccountRepoInsert = Omit<
  AccountDbInsert,
  'id' | 'createdAt' | 'updatedAt'
>;

export type AccountDbUpdate = Partial<
  Omit<AccountDbRow, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
>;
