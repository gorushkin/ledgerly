import { sqliteTable, text, unique } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt, uuidPrimary } from './common';
import { usersTable } from './users';

export const categoriesTable = sqliteTable(
  'categories',
  {
    createdAt,
    id: uuidPrimary,
    name: text('name').notNull(),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' }),
  },
  (table) => [unique().on(table.userId, table.name)],
);
