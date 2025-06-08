import { z } from "zod";

import { loginSchema, registerSchema, uuid } from "../validation";

export type LoginDto = z.infer<typeof loginSchema>;

export type RegisterDto = z.infer<typeof registerSchema>;

export type UUID = z.infer<typeof uuid>;
