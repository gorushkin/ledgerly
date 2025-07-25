import { z } from "zod";

import { createdAt, notNullText, updatedAt, uuid } from "./baseValidations";
export const categoryCreateSchema = z.object({
  name: notNullText,
  userId: uuid,
});

export const categoryResponseSchema = z.object({
  createdAt,
  id: uuid,
  name: notNullText,
  updatedAt,
  userId: uuid,
});

export const categoryUpdateSchema = z.object({
  name: notNullText,
});
