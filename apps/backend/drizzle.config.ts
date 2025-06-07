import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dbCredentials: {
    url: 'file:./data/sqlite.db',
  },
  dialect: 'sqlite',
  out: './drizzle/',
  schema: './src/db/schema.ts',
});
