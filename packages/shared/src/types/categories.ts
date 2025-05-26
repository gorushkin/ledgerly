import { z } from "zod";

import {
  categoryCreateSchema,
  categoryResponseSchema,
} from "../validation/categories";

export type CategoryCreateDTO = z.infer<typeof categoryCreateSchema>;
export type CategoryResponseDTO = z.infer<typeof categoryResponseSchema>;
