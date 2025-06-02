import { z } from "zod";

import { settingsCreateSchema, settingsResponseSchema } from "../validation";

export type SettingsCreateDTO = z.infer<typeof settingsCreateSchema>;

export type SettingsResponseDTO = z.infer<typeof settingsResponseSchema>;
