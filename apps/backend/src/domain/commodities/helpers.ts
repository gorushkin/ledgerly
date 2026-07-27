import {
  CommoditySymbolString,
  CommodityPrecisionNumber,
} from '@ledgerly/shared/types';
import {
  commoditySymbol,
  commodityPrecision,
} from '@ledgerly/shared/validation';

import { parseValueObject } from '../domain-core';
import {
  InvalidCommoditySymbolError,
  InvalidCommodityPrecisionError,
} from '../domain.errors';

export const parseCommoditySymbol = (
  symbol: string | null,
): CommoditySymbolString | null => {
  return parseValueObject(symbol, commoditySymbol, (cause, invalidValue) => {
    throw new InvalidCommoditySymbolError(invalidValue, cause);
  });
};

export const parseCommodityPrecision = (
  precision: number,
): CommodityPrecisionNumber => {
  return parseValueObject(
    precision,
    commodityPrecision,
    (cause, invalidValue) => {
      throw new InvalidCommodityPrecisionError(invalidValue, cause);
    },
  );
};
