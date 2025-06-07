import { AccountType } from "../types";

export const ACCOUNT_TYPES: AccountType[] = [
  "cash",
  "debit",
  "credit",
  "savings",
  "investment",
];

export const ACCOUNT_TYPE_VALUES = ACCOUNT_TYPES.map((t) => t) as [
  AccountType,
  ...AccountType[],
];
