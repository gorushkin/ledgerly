import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import { InferInsertModel, InferSelectModel } from 'drizzle-orm';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema } from 'drizzle-zod';

import { createdAt, description, updatedAt, uuid } from './common';

export const accounts = sqliteTable('accounts', {
  createdAt,
  currency_code: text('currency_code').notNull(),
  description,
  id: uuid,
  name: text('name').notNull(),
  type: text('type').notNull().default(ACCOUNT_TYPES[0].value),
  updatedAt,
});

export type Account = InferSelectModel<typeof accounts>;
export type AccountDTO = InferInsertModel<typeof accounts>;
export const accountInsertSchema = createInsertSchema(accounts);
