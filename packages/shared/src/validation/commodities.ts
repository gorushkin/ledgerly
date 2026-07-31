import { z } from "zod";

import { COMMODITY_STATUS_FILTER_VALUES } from "../constants";

import { requiredText } from "./baseValidations";

const COMMODITY_CODE_MIN_LENGTH = 3;
const COMMODITY_CODE_MAX_LENGTH = 16;

export const commodityCode = z
  .string()
  .trim()
  .toUpperCase()
  .min(
    COMMODITY_CODE_MIN_LENGTH,
    `Commodity code must be at least ${COMMODITY_CODE_MIN_LENGTH} characters long`,
  )
  .max(
    COMMODITY_CODE_MAX_LENGTH,
    `Commodity code must be at most ${COMMODITY_CODE_MAX_LENGTH} characters long`,
  )
  .regex(
    /^[A-Z][A-Z0-9]*$/,
    "Commodity code must start with a letter and contain only letters and digits",
  )
  .brand<"CommodityCode">();

export const commoditySymbol = z.string().trim().max(12).nullable();
export const commodityPrecision = z.number().int().min(0).max(18);

export const commodityCreateSchema = z.object({
  code: commodityCode,
  name: requiredText,
  precision: commodityPrecision.optional(),
  symbol: commoditySymbol.optional(),
});

export const commodityUpdateSchema = commodityCreateSchema
  .pick({
    code: true,
    name: true,
    symbol: true,
  })
  .partial();

export const commodityStatusFilter = z
  .enum(COMMODITY_STATUS_FILTER_VALUES)
  .default("active");

export const commodityQuerySchema = z.object({
  status: commodityStatusFilter,
});

export type CommodityQuery = z.infer<typeof commodityQuerySchema>;
