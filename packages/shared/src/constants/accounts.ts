import { AccountType } from "../types";
export const ACCOUNT_TYPES: AccountType[] = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((t) => t) as [
  AccountType,
  ...AccountType[],
];
