import {
  IsoDateString,
  IsoDatetimeString,
  Money,
  UUID,
} from '@ledgerly/shared/types';
import { integer, text } from 'drizzle-orm/sqlite-core';

export const createdAt = text('created_at')
  .notNull()
  .$type<IsoDatetimeString>();

export const updatedAt = text('updated_at')
  .notNull()
  .$type<IsoDatetimeString>();

export const description = text('description').notNull().default('');

export const hash = text('hash').notNull();
export const clientGeneratedId = text('id').primaryKey();

export const id = text('id').notNull().primaryKey().$type<UUID>();

export const getBooleanColumn = (fieldName: string) =>
  integer(fieldName, { mode: 'boolean' }).notNull().default(false);

export const isTombstone = getBooleanColumn('is_tombstone');

export const getNumericColumn = <T>(fieldName: string) => {
  return integer(fieldName).notNull().$type<T>();
};

export const getMoneyColumn = getNumericColumn<Money>;

export const getIsoDateString = (column: string) =>
  text(column).notNull().$type<IsoDateString>();
