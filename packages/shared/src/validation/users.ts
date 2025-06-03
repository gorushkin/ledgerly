import { z } from "zod";

import { createdAt, notNullText, updatedAt, uuid } from "./baseValidations";

export const usersCreateSchema = z.object({
  email: z
    .string()
    .email()
    .toLowerCase()
    .trim()
    .min(1)
    .max(255)
    .refine((email) => email.length <= 255, {
      message: "Email must be at most 255 characters long",
    }),
  name: notNullText,
});

export const usersResponseSchema = z
  .object({
    createdAt,
    id: uuid,
    updatedAt,
  })
  .merge(usersCreateSchema);
