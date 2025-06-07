import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt } from './common';
import { currencies } from './currencies';
import { users } from './users';

export const settings = sqliteTable('settings', {
  baseCurrency: text('base_currency')
    .notNull()
    .default('RUB')
    .references(() => currencies.code),
  createdAt,
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => users.id),
});
