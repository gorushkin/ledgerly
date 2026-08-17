import {
  IsoDateString,
  IsoDatetimeString,
  AmountString,
  UUID,
} from '@ledgerly/shared/types';
import { integer, text } from 'drizzle-orm/sqlite-core';

export const createdAt = text('created_at')
  .notNull()
  .$type<IsoDatetimeString>();

export const updatedAt = text('updated_at')
  .notNull()
  .$type<IsoDatetimeString>();
export const description = text('description').notNull();
export const hash = text('hash').notNull();
export const clientGeneratedId = text('id').primaryKey();
export const id = text('id').notNull().primaryKey().$type<UUID>();
export const getBooleanColumn = (fieldName: string) =>
  integer(fieldName, { mode: 'boolean' }).notNull();
export const isTombstone = getBooleanColumn('is_tombstone');
export const isClosed = getBooleanColumn('is_closed');
export const getNumericColumn = <T>(fieldName: string) => {
  return text(fieldName).notNull().$type<T>();
};
export const getAmountColumn = getNumericColumn<AmountString>;

export const getIsoDateString = (column: string) =>
  text(column).notNull().$type<IsoDateString>();
export const version = integer('version').notNull();
