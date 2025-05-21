import { text } from 'drizzle-orm/sqlite-core';

export const createdAt = text('created_at')
  .notNull()
  .default('CURRENT_TIMESTAMP');
export const updatedAt = text('updated_at')
  .notNull()
  .default('CURRENT_TIMESTAMP');

export const description = text('description');

export const uuid = text('id')
  .primaryKey()
  .$defaultFn(() => crypto.randomUUID());
