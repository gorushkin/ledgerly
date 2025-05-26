import { ACCOUNT_TYPES, ACCOUNT_TYPE_VALUES } from '@ledgerly/shared/constants';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, uuidPrimary } from './common';
import { currencies } from './currencies';

export const accounts = sqliteTable('accounts', {
  createdAt,
  currency_code: text('currency_code')
    .notNull()
    .references(() => currencies.code),
  description,
  id: uuidPrimary,
  name: text('name').notNull(),
  type: text('type', {
    enum: ACCOUNT_TYPE_VALUES,
  })
    .notNull()
    .default(ACCOUNT_TYPES[0]),
  updatedAt,
});
