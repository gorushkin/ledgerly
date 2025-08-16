import { z } from "zod";

export const requiredText = z.string().default("");

export const defaultText = z.string().default("");
export const defaultNumber = z.number().default(0).optional();
export const notNullText = z.string().min(1, "This field cannot be empty");
export const updatedAt = z.string();
export const createdAt = z.string();
export const uuid = z.string().uuid();
export const name = z.string().min(1);
export const dateText = z.string().refine((d) => !isNaN(Date.parse(d)), {
  message: "Invalid date format",
});

export const uniqueIdSchema = z.object({
  id: uuid,
});

export const currencyCode = z
  .string()
  .length(3, "Currency code must be exactly 3 characters");

export const isoDatetime = z.string().datetime().brand<"IsoDatetimeString">();
