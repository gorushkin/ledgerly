import { CurrencyCode } from '@ledgerly/shared/types';

// Response DTOs
export type CurrencyResponseDTO = {
  code: CurrencyCode;
  name: string;
  symbol: string;
};

// Query DTOs
export type GetCurrenciesQueryDTO = {
  codes?: CurrencyCode[];
};
