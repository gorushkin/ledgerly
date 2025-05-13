import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';
import { config } from 'src/config/config';

dotenv.config();

if (!config.dbUrl) {
  throw new Error('DB_URL is not defined');
}

export default defineConfig({
  dbCredentials: {
    url: config.dbUrl,
  },
  dialect: 'sqlite',
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
});
