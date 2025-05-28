import { sqliteTable, text, real } from 'drizzle-orm/sqlite-core';

import { accounts } from './accounts';
import { categories } from './categories';
import { description, createdAt, uuidPrimary, updatedAt } from './common';
import { currencies } from './currencies';
import { transactions } from './transactions';

export const operations = sqliteTable('operations', {
  accountId: text('account_id')
    .notNull()
    .references(() => accounts.id),
  baseCurrency: text('base_currency')
    .notNull()
    .references(() => currencies.code),
  categoryId: text('category_id')
    .notNull()
    .references(() => categories.id),
  createdAt,
  description,
  id: uuidPrimary,
  localAmount: real('local_amount').notNull(),
  originalAmount: real('original_amount').notNull(),
  originalCurrency: text('original_currency')
    .notNull()
    .references(() => currencies.code),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  updatedAt,
});
