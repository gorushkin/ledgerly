import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt } from './common';
import { currenciesTable } from './currencies';
import { usersTable } from './users';

export const settingsTable = sqliteTable('settings', {
  baseCurrency: text('base_currency')
    .notNull()
    .default('RUB')
    .references(() => currenciesTable.code),
  createdAt,
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id),
});
