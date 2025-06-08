import { relations } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { categories } from './categories';
import { createdAt, updatedAt, uuidPrimary } from './common';

export const users = sqliteTable('users', {
  createdAt,
  email: text('email').notNull().unique(),
  id: uuidPrimary,
  name: text('name').notNull(),
  password: text('password').notNull(),
  updatedAt,
});

export const usersRelations = relations(users, ({ many }) => ({
  categories: many(categories),
}));
