import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';

import { config } from '../config/config';

import * as schemas from './schemas';

dotenv.config();

const dbUrl = config.dbUrl;
// const dbUrl = config.dbUrl || 'file:./data/sqlite.db';

if (!dbUrl) {
  throw new Error('Database URL is not defined');
}

const client = createClient({ url: dbUrl });

export const db = drizzle(client, {
  schema: schemas,
});
