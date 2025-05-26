import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt } from './common';

export const currencies = sqliteTable('currencies', {
  code: text('code').notNull().primaryKey(),
  createdAt,
  updatedAt,
});
