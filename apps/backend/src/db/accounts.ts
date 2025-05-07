import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { CURRENCIES } from "../../../../packages/shared/constants/currencies";
import { ACCOUNT_TYPES } from "../../../../packages/shared/constants/accountTypes";

export function isValidCurrencyCode(code: string): boolean {
  return CURRENCIES.some((currency) => currency.code === code);
}

export function isValidAccountType(type: string): boolean {
  return ACCOUNT_TYPES.some((accountType) => accountType.value === type);
}

export const accounts = sqliteTable("wallets", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()), // Use crypto.randomUUID() for default UUID generation
  name: text("name").notNull(),
  // Validate currency_code against the shared CURRENCIES list
  currency_code: text("currency_code").notNull(),
  type: text("type").notNull().default("budget"), // Пример: 'budget', 'non-budget'
});
