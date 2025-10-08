import { z } from "zod";

import { loginSchema, registerSchema } from "../validation";

export type LoginDto = z.infer<typeof loginSchema>;

export type RegisterDto = z.infer<typeof registerSchema>;
