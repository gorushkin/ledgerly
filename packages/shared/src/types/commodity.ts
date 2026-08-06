import { z } from "zod";

import {
  commodityCode,
  commodityPrecision,
  commoditySymbol,
} from "../validation";

import { IsoDatetimeString, RequiredText, UUID } from "./types";

export type CommodityCodeString = z.infer<typeof commodityCode>;
export type CommodityPrecisionNumber = z.infer<typeof commodityPrecision>;
export type CommoditySymbolString = z.infer<typeof commoditySymbol>;

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
  isClosed: boolean;
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
