import { createClient } from '@libsql/client';
import * as dotenv from 'dotenv';
import { drizzle } from 'drizzle-orm/libsql';

import { config } from '../config/config';

import * as schemas from './schemas';

dotenv.config();

const isTestEnvironment =
  process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';

export type DataBase = ReturnType<typeof drizzle<typeof schemas>>;

export type TxType = Parameters<Parameters<DataBase['transaction']>[0]>[0];

let db: DataBase;

if (isTestEnvironment) {
  const client = createClient({ url: 'file::memory:' });
  db = drizzle(client, { schema: schemas });
} else {
  const dbUrl = config.dbUrl;

  if (!dbUrl) {
    throw new Error('Database URL is not defined');
  }

  const client = createClient({ url: dbUrl });
  db = drizzle(client, { schema: schemas });
}

export { db };
