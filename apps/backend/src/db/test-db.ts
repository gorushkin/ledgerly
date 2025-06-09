import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { UsersResponse } from '@ledgerly/shared/types';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';

import * as schema from './schemas';
import { users } from './schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createTestDb = () => {
  const client = createClient({
    url: 'file::memory:',
  });

  const db = drizzle(client, { schema });

  // const testDb = async () => {
  //   try {
  //     const result = await db.all(
  //       sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users';`,
  //     );
  //     console.info('result: ', result);
  //     if (result.length > 0) {
  //       console.info('✅ Users table exists');
  //       // Дополнительная проверка структуры таблицы users
  //       const tableInfo = await db.all(sql`PRAGMA table_info(users);`);
  //       console.info('📋 Users table structure:', tableInfo);
  //     } else {
  //       console.info('❌ Users table not found');
  //     }
  //   } catch (error) {
  //     console.error('❌ Error checking users table:', error);
  //   }
  // };

  const setupTestDb = async () => {
    await db.run(sql`PRAGMA foreign_keys = ON;`);

    const migrationsPath = join(__dirname, '../../drizzle');
    // console.info('🔍 Migrations path:', migrationsPath);

    await migrate(db, { migrationsFolder: migrationsPath });

    // console.info('migrationsPath: ', migrationsPath);

    // console.info('✅ Migration applied successfully');

    // await testDb();
  };

  const cleanupTestDb = async () => {
    await db.run(sql`PRAGMA foreign_keys = OFF;`);

    const tables = Object.keys(schema);

    for (const table of tables) {
      await db.run(sql.raw(`DROP TABLE IF EXISTS ${table};`));
    }
  };

  const createUser = async (params?: {
    email?: string;
    name?: string;
    password?: string;
  }): Promise<UsersResponse> => {
    const userData = {
      email: params?.email ?? `test-${Date.now()}@example.com`,
      name: params?.name ?? 'Test User',
      password: params?.password ?? 'test123',
    };

    const passwordManager = new PasswordManager();

    const hashedPassword = await passwordManager.hash(userData.password);

    const user = await db
      .insert(users)
      .values({
        email: userData.email,
        id: crypto.randomUUID(),
        name: userData.name,
        password: hashedPassword,
      })
      .returning()
      .get();

    return user;
  };

  return { cleanupTestDb, createUser, db, setupTestDb };
};

// const { cleanupTestDb, db, setupTestDb } = createTestDb();

// const run = async () => {
//   await cleanupTestDb();
//   await setupTestDb();

//   // Тестируем работу с таблицей users
//   try {
//     console.info('🧪 Testing users table operations...');

//     // Попробуем вставить тестового пользователя
//     await db.run(
//       sql`INSERT INTO users (id, email, password, name) VALUES ('test-id', 'test@example.com', 'hashed-password', 'Test User')`,
//     );
//     console.info('✅ Successfully inserted test user');

//     // Попробуем получить пользователя
//     const users = await db.all(
//       sql`SELECT * FROM users WHERE email = 'test@example.com'`,
//     );
//     console.info('✅ Successfully retrieved user:', users[0]);

//     // Подсчитаем количество пользователей
//     const count = await db.all(sql`SELECT COUNT(*) as count FROM users`);
//     console.info('📊 Total users count:', count[0]);
//   } catch (error) {
//     console.error('❌ Error testing users table:', error);
//   }
// };

// void run();
