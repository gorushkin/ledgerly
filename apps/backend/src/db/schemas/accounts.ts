import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ACCOUNT_TYPES } from '../../../../../packages/shared/constants/accountTypes';

export const accounts = sqliteTable('accounts', {
  currency_code: text('currency_code').notNull(),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull().default(ACCOUNT_TYPES[0].value),
});
