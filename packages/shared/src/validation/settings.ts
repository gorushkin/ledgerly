import { z } from "zod";

import { currencyCode } from "./baseValidations";

export const settingsCreateSchema = z.object({
  baseCurrency: currencyCode,
});

export const settingsResponseSchema = z.object({}).merge(settingsCreateSchema);
