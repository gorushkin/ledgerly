import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import * as dotenv from "dotenv";
import { config } from "../config/config";

dotenv.config();

const env = config.env;
const dbUrl = config.dbUrl;

if (!dbUrl) {
  throw new Error("Database URL is not defined");
}

const sqlite = new Database(dbUrl!, {
  fileMustExist: env === "production",
  verbose: console.log, // added for logging SQL statements
});

export const db = drizzle(sqlite, { schema });
