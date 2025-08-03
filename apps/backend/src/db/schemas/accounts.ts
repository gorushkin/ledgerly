import { ACCOUNT_TYPES, ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { sqliteTable, text, uniqueIndex, real } from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, uuidPrimary } from './common';
import { currencies } from './currencies';
import { usersTable } from './users';

export const accountsTable = sqliteTable(
  'accounts',
  {
    balance: real('balance').notNull(),
    createdAt,
    description,
    id: uuidPrimary,
    initialBalance: real('initial_balance').notNull(),
    name: text('name').notNull(),
    originalCurrency: text('original_currency')
      .notNull()
      .references(() => currencies.code),
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
