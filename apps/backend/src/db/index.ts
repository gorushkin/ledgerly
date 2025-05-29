import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';

import { config } from '../config/config';

dotenv.config();

const dbUrl = config.dbUrl;

if (!dbUrl) {
  throw new Error('Database URL is not defined');
}

import * as schemas from './schemas';
const client = createClient({ url: dbUrl });

export const db = drizzle(client, {
  schema: schemas,
});

export { currencies, categories, accounts } from '../db/schemas/';
