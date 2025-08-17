import { IsoDatetimeString } from '@ledgerly/shared/types';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { generateId } from 'src/libs/idGenerator';

// eslint-disable-next-line prettier/prettier
export const createdAt = text('created_at')
  .notNull()
  .$type<IsoDatetimeString>();
// eslint-disable-next-line prettier/prettier
export const updatedAt = text('updated_at')
  .notNull()
  .$type<IsoDatetimeString>();

export const description = text('description').notNull().default('');

export const stop_uuid = text('id').$defaultFn(generateId);

export const hash = text('hash').notNull();
export const clientGeneratedId = text('id').primaryKey();

export const stop_uuidPrimary = stop_uuid.primaryKey();
export const uuid = text('id').notNull().primaryKey();

export const isTombstone = integer('is_tombstone', { mode: 'boolean' })
  .default(false)
  .notNull();
