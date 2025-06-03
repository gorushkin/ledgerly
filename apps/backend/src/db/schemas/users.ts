import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt, uuidPrimary } from './common';

export const users = sqliteTable('users', {
  createdAt,
  email: text('email').notNull().unique(),
  id: uuidPrimary,
  name: text('name').notNull(),
  updatedAt,
});
