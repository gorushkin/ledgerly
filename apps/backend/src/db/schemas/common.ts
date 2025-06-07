import { randomUUID } from 'node:crypto';

import { sql } from 'drizzle-orm';
import { text } from 'drizzle-orm/sqlite-core';

const timestamp = (name: string) =>
  text(name)
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`);

export const createdAt = timestamp('created_at');

export const updatedAt = timestamp('updated_at');

export const description = text('description').notNull().default('');

export const uuid = text('id').$defaultFn(() => randomUUID());

export const uuidPrimary = uuid.primaryKey();
