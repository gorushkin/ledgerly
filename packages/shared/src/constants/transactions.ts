import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from "./pagination";

export const DEFAULT_TRANSACTION_SORT_BY = "transactionDate";
export const DEFAULT_TRANSACTION_SORT_ORDER = "desc";

export const DEFAULT_TRANSACTION_QUERY = {
  page: DEFAULT_PAGE,
  pageSize: DEFAULT_PAGE_SIZE,
  sortBy: DEFAULT_TRANSACTION_SORT_BY,
  sortOrder: DEFAULT_TRANSACTION_SORT_ORDER,
} as const;
