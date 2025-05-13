import * as dotenv from 'dotenv';

dotenv.config();

export const config = {
  dbUrl: process.env.DATABASE_URL,
  env: process.env.NODE_ENV ?? 'development',
  isProd: process.env.NODE_ENV === 'production',
};
