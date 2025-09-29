import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { createdAt, updatedAt, id } from './common';

export const usersTable = sqliteTable('users', {
  createdAt,
  email: text('email').notNull().unique(),
  id,
  name: text('name').notNull(),
  password: text('password').notNull(),
  updatedAt,
});

export type UserDbRow = InferSelectModel<typeof usersTable>;

export type UserDbInsert = InferInsertModel<typeof usersTable>;
