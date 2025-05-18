/* eslint-disable no-console */
import { sql } from 'drizzle-orm';

import { db } from '../index';

async function dropTables() {
  try {
    await db.run(sql`PRAGMA foreign_keys = OFF;`);

    const tables = await db.all<{ name: string }>(
      sql`SELECT name 
      FROM sqlite_schema 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`,
    );

    console.log('tables: ', tables);

    for (const { name } of tables) {
      console.log(`Dropping table ${name}…`);
      await db.run(sql.raw(`DROP TABLE IF EXISTS "${name}";`));
    }

    console.log('All tables dropped successfully!');
  } catch (error) {
    console.error('Error dropping tables:', error);
  }
}

void dropTables();
