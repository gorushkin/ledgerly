export const COMMODITY_STATUS_FILTER_VALUES = [
  "open",
  "closed",
  "all",
] as const;

export type CommodityStatusFilterValue =
  (typeof COMMODITY_STATUS_FILTER_VALUES)[number];
