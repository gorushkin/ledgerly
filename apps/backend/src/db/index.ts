import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';

import { config } from '../config/config';

dotenv.config();

const dbUrl = config.dbUrl;

if (!dbUrl) {
  throw new Error('Database URL is not defined');
}

export const db = drizzle(dbUrl);
