import { AccountTypeValue } from "../types";
export const ACCOUNT_TYPES: AccountTypeValue[] = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
  "currencyTrading",
];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((t) => t) as [
  AccountTypeValue,
  ...AccountTypeValue[],
];
