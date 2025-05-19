import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import * as dotenv from 'dotenv';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../../.env') });

const envSchema = z.object({
  DATABASE_URL: z.string({
    invalid_type_error: 'DB_URL must be a string',
    required_error: 'DB_URL is required',
  }),
});

const processEnv = envSchema.parse(process.env);

export const env = {
  dbUrl: processEnv.DATABASE_URL,
} as const;
