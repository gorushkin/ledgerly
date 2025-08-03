import { sql } from 'drizzle-orm';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { generateId } from 'src/libs/idGenerator';

const timestamp = (name: string) =>
  text(name)
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`);

export const createdAt = timestamp('created_at');

export const updatedAt = timestamp('updated_at');

export const description = text('description').notNull().default('');

export const uuid = text('id').$defaultFn(generateId);

export const hash = text('hash').notNull();
export const clientGeneratedId = text('id').primaryKey();

export const uuidPrimary = uuid.primaryKey();

export const isTombstone = integer('is_tombstone', { mode: 'boolean' })
  .default(false)
  .notNull();
