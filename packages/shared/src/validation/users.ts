import { z } from "zod";

import { notNullText } from "./baseValidations";

const password = z
  .string()
  .min(8)
  .max(255)
  .refine((password) => password.length <= 255, {
    message: "Password must be at most 255 characters long",
  });

export const usersCreateSchema = z.object({
  email: z.string().email().toLowerCase().trim().min(1).max(255),
  name: notNullText,
  password,
});

export const usersResponseSchema = z
  .object({
    id: z.string(),
  })
  .merge(usersCreateSchema.omit({ password: true }));

export const usersUpdateSchema = z
  .object({
    email: z.string().email().toLowerCase().trim().min(1).max(255).optional(),
    name: notNullText.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const passwordChangeSchema = z.object({
  currentPassword: notNullText,
  newPassword: password,
});
