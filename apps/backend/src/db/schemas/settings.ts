import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt } from './common';
import { usersTable } from './users';

export const settingsTable = sqliteTable('settings', {
  createdAt,
  updatedAt,
  userId: text('user_id')
    .notNull()
    .references(() => usersTable.id),
});
