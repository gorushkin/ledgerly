import {
  CommodityCodeString,
  CommoditySymbolString,
  IsoDatetimeString,
  UUID,
  CommodityPrecisionNumber,
  RequiredText,
} from '@ledgerly/shared/types';

export type CommoditySnapshot = {
  createdAt: IsoDatetimeString;
  id: UUID;
  isTombstone: boolean;
  code: CommodityCodeString;
  isClosed: boolean;
  symbol: CommoditySymbolString | null;
  updatedAt: IsoDatetimeString;
  userId: UUID;
  name: RequiredText;
  precision: CommodityPrecisionNumber;
};

export type CommodityUpdateProps = Partial<{
  code: CommodityCodeString;
  symbol: CommoditySymbolString | null;
  name: RequiredText;
}>;

export type CreateCommodityProps = {
  code: CommodityCodeString;
  name: RequiredText;
  precision?: CommodityPrecisionNumber;
  symbol?: CommoditySymbolString | null;
};
