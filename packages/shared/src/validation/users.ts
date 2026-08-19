import { z } from "zod";

import { requiredText } from "./baseValidations";

const password = z
  .string()
  .min(8)
  .max(255)
  .refine((password) => password.length <= 255, {
    message: "Password must be at most 255 characters long",
  });

const normalizedEmail = z.string().trim().toLowerCase().min(1).max(255).email();

export const usersCreateSchema = z.object({
  email: normalizedEmail,
  name: requiredText,
  password,
});

export const usersResponseSchema = z
  .object({
    id: z.string(),
  })
  .merge(usersCreateSchema.omit({ password: true }));

export const usersUpdateSchema = z
  .object({
    email: normalizedEmail.optional(),
    name: requiredText.optional(),
  })
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  });

export const passwordChangeSchema = z
  .object({
    currentPassword: requiredText,
    newPassword: password,
  })
  .strict();
