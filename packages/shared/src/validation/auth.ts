import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string({
      invalid_type_error: "Email must be a string",
      required_error: "Email is required",
    })
    .email("Please enter a valid email address"),
  password: z
    .string({
      invalid_type_error: "Password must be a string",
      required_error: "Password is required",
    })
    .min(8, "Password must be at least 8 characters long"),
});

export const registerSchema = loginSchema.extend({
  name: z
    .string({
      invalid_type_error: "Name must be a string",
      required_error: "Name is required",
    })
    .min(2, "Name must be at least 2 characters long"),
});

export const passwordValidation = z
  .string({
    invalid_type_error: "Password must be a string",
    required_error: "Password is required",
  })
  .min(8, "Password must be at least 8 characters long");
