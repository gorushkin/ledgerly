import {
  CommodityCodeString,
  CommoditySymbolString,
  IsoDatetimeString,
  UUID,
  CommodityPrecisionNumber,
  NameString,
} from '@ledgerly/shared/types';

export type CommoditySnapshot = {
  createdAt: IsoDatetimeString;
  id: UUID;
  isTombstone: boolean;
  code: CommodityCodeString;
  symbol: CommoditySymbolString | null;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  name: NameString;
  precision: CommodityPrecisionNumber;
};

export type CommodityUpdateProps = Partial<{
  code: CommodityCodeString;
  symbol: CommoditySymbolString | null;
  name: NameString;
}>;

export type CreateCommodityProps = {
  code: CommodityCodeString;
  name: NameString;
  precision?: CommodityPrecisionNumber;
  symbol?: CommoditySymbolString | null;
};
