import { CurrencyCode } from '@ledgerly/shared/types';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const currenciesTable = sqliteTable('currencies', {
  code: text('code').notNull().primaryKey().$type<CurrencyCode>(),
  name: text('name').notNull(),
  symbol: text('symbol').notNull(),
});
