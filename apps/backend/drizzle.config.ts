import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";
import { config } from "src/config/config";

dotenv.config();

export default defineConfig({
  out: "./src/db/migrations",
  schema: "./src/db/schema.ts",
  dialect: "sqlite",
  dbCredentials: {
    url: config.dbUrl!,
  },
});
