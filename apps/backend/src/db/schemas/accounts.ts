import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { ACCOUNT_TYPES } from '../../../../../packages/shared/constants/accountTypes';
import { BUDGET_ACCOUNT_TYPES } from '../../../../../packages/shared/constants/budgetTypes';
import { CURRENCIES } from '../../../../../packages/shared/constants/currencies';

export function isValidCurrencyCode(code: string): boolean {
  return CURRENCIES.some((currency) => currency.code === code);
}

export function isValidAccountType(type: string): boolean {
  return ACCOUNT_TYPES.some((accountType) => accountType.value === type);
}

export const accounts = sqliteTable('accounts', {
  budget_type: text('type').notNull().default(BUDGET_ACCOUNT_TYPES[0].value),
  currency_code: text('currency_code').notNull(),
  id: text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  type: text('type').notNull().default(ACCOUNT_TYPES[0].value),
});
