import { z } from 'zod';

import { env } from '../../env.config';

const envSchema = z.object({
  DATABASE_URL: z
    .string({
      invalid_type_error: 'DATABASE_URL must be a string',
      required_error: 'DATABASE_URL is required',
    })
    .default(env.dbUrl),
  JWT_SECRET: z
    .string({
      invalid_type_error: 'JWT_SECRET must be a string',
      required_error: 'JWT_SECRET is required',
    })
    .nonempty(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Validate environment variables
const parsedEnv = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
});

export const config = {
  dbUrl: parsedEnv.DATABASE_URL,
  env: parsedEnv.NODE_ENV,
  isProd: parsedEnv.NODE_ENV === 'production',
  jwtSecret: parsedEnv.JWT_SECRET,
};
