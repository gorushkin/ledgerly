import { UUID } from '@ledgerly/shared/types';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

import { createdAt, description, updatedAt, id, isTombstone } from './common';
import { usersTable } from './users';

export const commoditiesTable = sqliteTable(
  'commodities',
  {
    code: text('code').notNull(),
    createdAt,
    description,
    id,
    isTombstone,
    name: text('name').notNull(),
    precision: integer('precision').notNull(),
    symbol: text('symbol'),
    updatedAt,
    userId: text('user_id')
      .notNull()
      .references(() => usersTable.id, { onDelete: 'cascade' })
      .$type<UUID>(),
  },
  (table) => [
    uniqueIndex('commodities_user_id_code_unique_idx').on(
      table.userId,
      table.code,
    ),
  ],
);

export type CommodityDbRow = InferSelectModel<typeof commoditiesTable>;
export type CommodityDbInsert = InferInsertModel<typeof commoditiesTable>;
