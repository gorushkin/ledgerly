import { z } from "zod";

import { notNullText, uuid } from "./baseValidations";

export const categoryCreateSchema = z.object({
  name: notNullText,
});

export const categoryResponseSchema = z.object({
  id: uuid,
  name: notNullText,
});
