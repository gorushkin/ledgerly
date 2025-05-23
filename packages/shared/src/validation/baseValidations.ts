import { z } from "zod";

export const description = z.string().optional();
export const updatedAt = z.string();
export const createdAt = z.string();
export const uuid = z.string().uuid();
export const name = z.string().min(1);
