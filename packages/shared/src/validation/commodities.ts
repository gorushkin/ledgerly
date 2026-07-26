import { z } from "zod";

import {
  requiredText,
  commodityPrecision,
  commoditySymbol,
  commodityCode,
} from "./baseValidations";

export const commodityCreateSchema = z.object({
  code: commodityCode,
  name: requiredText,
  precision: commodityPrecision.optional(),
  symbol: commoditySymbol.nullable().optional(),
});

export const commodityUpdateSchema = commodityCreateSchema
  .pick({
    code: true,
    name: true,
    symbol: true,
  })
  .partial();
