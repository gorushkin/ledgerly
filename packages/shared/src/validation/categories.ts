import { z } from "zod";

import { notNullText, uuid } from "./baseValidations";

export const categoryCreateSchema = z.object({
  name: notNullText,
  userId: uuid,
});

export const categoryResponseSchema = z.object({
  id: uuid,
  name: notNullText,
});

export const categoryUpdateSchema = z.object({
  id: uuid,
  name: notNullText,
  userId: uuid,
});
