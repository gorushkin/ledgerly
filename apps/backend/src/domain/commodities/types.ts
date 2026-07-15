import {
  CommodityCodeString,
  CommoditySymbolString,
  IsoDatetimeString,
  UUID,
  CommodityPrecisionNumber,
} from '@ledgerly/shared/types';

export type CommoditySnapshot = {
  createdAt: IsoDatetimeString;
  id: UUID;
  isTombstone: boolean;
  code: CommodityCodeString;
  symbol: CommoditySymbolString | null;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  name: string;
  precision: CommodityPrecisionNumber;
};

export type CommodityUpdateProps = Partial<{
  code: string;
  symbol: string | null;
  name: string;
}>;
