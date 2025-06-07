import { ACCOUNT_TYPES, ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, uuidPrimary } from './common';
import { currencies } from './currencies';
import { users } from './users';

export const accounts = sqliteTable('accounts', {
  createdAt,
  description,
  id: uuidPrimary,
  name: text('name').notNull(),
  originalCurrency: text('original_currency')
    .default('RUB')
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
    .references(() => users.id, { onDelete: 'cascade' }),
});
