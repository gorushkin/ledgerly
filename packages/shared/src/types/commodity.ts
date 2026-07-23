import {
  CommodityCodeString,
  CommodityPrecisionNumber,
  CommoditySymbolString,
  IsoDatetimeString,
  NameString,
  UUID,
} from "./types";

export type CommodityCreateDTO = {
  code: CommodityCodeString;
  name: NameString;
  precision?: CommodityPrecisionNumber;
  symbol?: CommoditySymbolString | null;
};

export type CommodityResponseDTO = {
  code: CommodityCodeString;
  createdAt: IsoDatetimeString;
  id: UUID;
  isTombstone: boolean;
  name: NameString;
  precision: CommodityPrecisionNumber;
  symbol: CommoditySymbolString | null;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};
