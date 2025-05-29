import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const currencies = sqliteTable('currencies', {
  code: text('code').notNull().primaryKey(),
});
