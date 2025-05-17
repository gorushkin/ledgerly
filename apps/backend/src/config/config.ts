import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load root .env file
dotenv.config({ path: resolve(__dirname, '../../../../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string({
    invalid_type_error: 'DATABASE_URL must be a string',
    required_error: 'DATABASE_URL is required',
  }),
  FRONTEND_URL: z.string({
    invalid_type_error: 'FRONTEND_URL must be a string',
    required_error: 'FRONTEND_URL is required',
  }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Validate environment variables
const parsedEnv = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  NODE_ENV: process.env.NODE_ENV,
});

export const config = {
  dbUrl: parsedEnv.DATABASE_URL,
  env: parsedEnv.NODE_ENV,
  frontendUrl: parsedEnv.FRONTEND_URL,
  isProd: parsedEnv.NODE_ENV === 'production',
};
