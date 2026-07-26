import {
  CommodityCodeString,
  CommodityPrecisionNumber,
  CommoditySymbolString,
  IsoDatetimeString,
  RequiredText,
  UUID,
} from "./types";

export type CommodityCreateDTO = {
  code: CommodityCodeString;
  name: RequiredText;
  precision?: CommodityPrecisionNumber;
  symbol?: CommoditySymbolString | null;
};

export type CommodityResponseDTO = {
  code: CommodityCodeString;
  createdAt: IsoDatetimeString;
  id: UUID;
  isTombstone: boolean;
  name: RequiredText;
  precision: CommodityPrecisionNumber;
  symbol: CommoditySymbolString | null;
  updatedAt: IsoDatetimeString;
  userId: UUID;
};

export type CommodityUpdateDTO = Partial<
  Pick<CommodityCreateDTO, "name" | "code" | "symbol">
>;
