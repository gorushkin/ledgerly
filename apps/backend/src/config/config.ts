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
  FRONTEND_HOST: z.string({
    invalid_type_error: 'FRONTEND_HOST must be a string',
    required_error: 'FRONTEND_HOST is required',
  }),
  FRONTEND_PORT: z.string({
    invalid_type_error: 'FRONTEND_PORT must be a string',
    required_error: 'FRONTEND_PORT is required',
  }),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

// Validate environment variables
const parsedEnv = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  FRONTEND_HOST: process.env.FRONTEND_HOST,
  FRONTEND_PORT: process.env.FRONTEND_PORT,
  NODE_ENV: process.env.NODE_ENV,
});

export const config = {
  dbUrl: parsedEnv.DATABASE_URL,
  env: parsedEnv.NODE_ENV,
  frontendUrl: `${parsedEnv.FRONTEND_HOST}:${parsedEnv.FRONTEND_PORT}`,
  isProd: parsedEnv.NODE_ENV === 'production',
};
