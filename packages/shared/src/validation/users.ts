import { z } from "zod";

import { notNullText } from "./baseValidations";

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
  password: notNullText,
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
  newPassword: notNullText,
});
