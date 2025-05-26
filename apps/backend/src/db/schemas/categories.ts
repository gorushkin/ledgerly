import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { uuidPrimary } from './common';

export const categories = sqliteTable('categories', {
  id: uuidPrimary,
  name: text('name').notNull(),
});
