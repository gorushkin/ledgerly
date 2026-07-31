import type { AccountTypeValue } from "../types";

export const ACCOUNT_TYPES = [
  "asset",
  "liability",
  "equity",
  "income",
  "expense",
  "currencyTrading",
] as const satisfies readonly AccountTypeValue[];

export const ACCOUNT_STATUS_FILTER_VALUES = ["open", "closed", "all"] as const;
