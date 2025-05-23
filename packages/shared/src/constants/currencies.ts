import { Currency } from "../types";

export const CURRENCY_TYPES: Currency[] = [
  "USD",
  "EUR",
  "RUB",
  "JPY",
  "GBP",
  "AUD",
  "CAD",
  "CHF",
  "CNY",
  "INR",
];

export const CURRENCY_TYPE_VALUES = CURRENCY_TYPES.map((t) => t) as [
  Currency,
  ...Currency[],
];
