import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url: 'file:./data/sqlite.db',
  },
  dialect: 'sqlite',
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
});
