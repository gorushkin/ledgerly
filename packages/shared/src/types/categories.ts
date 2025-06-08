import { z } from "zod";

import {
  categoryCreateSchema,
  categoryResponseSchema,
  categoryUpdateSchema,
} from "../validation/categories";

export type CategoryCreate = z.infer<typeof categoryCreateSchema>;
export type CategoryResponse = z.infer<typeof categoryResponseSchema>;
export type CategoryUpdate = z.infer<typeof categoryUpdateSchema>;
