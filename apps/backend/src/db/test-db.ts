import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';

import * as schema from './schemas';

export const createTestDb = () => {
  const client = createClient({
    url: 'file::memory:',
  });

  const db = drizzle(client, { schema });

  const setupTestDb = async () => {
    await db.run(sql`PRAGMA foreign_keys = ON;`);

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY NOT NULL,
        email text UNIQUE NOT NULL,
        password text NOT NULL,
        name text NOT NULL,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      );
    `);
  };

  const cleanupTestDb = async () => {
    await db.run(sql`PRAGMA foreign_keys = OFF;`);

    await db.run(sql`
      DROP TABLE IF EXISTS users;
    `);
  };

  return { cleanupTestDb, db, setupTestDb };
};
