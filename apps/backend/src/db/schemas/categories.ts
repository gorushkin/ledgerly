import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt, uuidPrimary } from './common';
import { users } from './users';

export const categories = sqliteTable(
  'categories',
  {
    createdAt,
    id: uuidPrimary,
    name: text('name').notNull(),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.userId, table.name)],
);
