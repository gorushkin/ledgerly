import { IsoDatetimeString, UUID } from '@ledgerly/shared/types';
import { integer, text } from 'drizzle-orm/sqlite-core';
import { generateId } from 'src/libs/idGenerator';

export const createdAt = text('created_at')
  .notNull()
  .$type<IsoDatetimeString>();

export const updatedAt = text('updated_at')
  .notNull()
  .$type<IsoDatetimeString>();

export const description = text('description').notNull().default('');

export const stop_uuid = text('id').$defaultFn(generateId);

export const hash = text('hash').notNull();
export const clientGeneratedId = text('id').primaryKey();

export const stop_uuidPrimary = stop_uuid.primaryKey();
export const id = text('id').notNull().primaryKey().$type<UUID>();

export const isTombstone = integer('is_tombstone', { mode: 'boolean' })
  .default(false)
  .notNull();

export const getMoneyColumn = (fieldName: string) => {
  return integer(fieldName).notNull();
};
