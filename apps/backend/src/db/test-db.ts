import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import { AccountType, UsersResponse, UUID } from '@ledgerly/shared/types';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';

import * as schema from './schemas';
import { accounts, categories, users } from './schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const createTestDb = () => {
  const client = createClient({
    url: 'file::memory:',
  });

  const db = drizzle(client, { schema });

  const testDb = async () => {
    try {
      const result = await db.all(
        sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users';`,
      );
      console.info('result: ', result);
      if (result.length > 0) {
        console.info('✅ Users table exists');
        // Дополнительная проверка структуры таблицы users
        const tableInfo = await db.all(sql`PRAGMA table_info(users);`);
        console.info('📋 Users table structure:', tableInfo);
      } else {
        console.info('❌ Users table not found');
      }
    } catch (error) {
      console.error('❌ Error checking users table:', error);
    }
  };

  const setupTestDb = async () => {
    try {
      await db.run(sql`PRAGMA foreign_keys = ON;`);

      const migrationsFolder = join(__dirname, '../../drizzle');
      // console.info('🔍 Migrations path:', migrationsFolder);

      await migrate(db, { migrationsFolder });

      // console.info('✅ Migration applied successfully');

      // await testDb();
    } catch (error) {
      console.error('❌ Error setting up test database:', error);
      throw error;
    }
  };

  const cleanupTestDb = async () => {
    await db.run(sql`PRAGMA foreign_keys = OFF;`);

    const tables = Object.keys(schema);

    for (const table of tables) {
      await db.run(sql.raw(`DROP TABLE IF EXISTS ${table};`));
    }
    // console.info('✅ Test database cleaned up');
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

  const createTestAccount = async (
    userId: UUID,
    params?: {
      name?: string;
      originalCurrency?: string;
      type?: AccountType;
    },
  ) => {
    const accountData = {
      name: 'Test Account',
      originalCurrency: 'USD',
      type: ACCOUNT_TYPES[0],
      ...params,
      userId,
    };

    const account = await db
      .insert(accounts)
      .values({
        name: accountData.name,
        originalCurrency: accountData.originalCurrency,
        type: accountData.type,
        userId: accountData.userId,
      })
      .returning()
      .get();

    return account;
  };

  const createTestCategory = (
    userId: UUID,
    params?: {
      name?: string;
    },
  ) => {
    const categoryData = {
      name: 'Test Category',
      ...params,
      userId,
    };

    return db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        ...categoryData,
      })
      .returning()
      .get();
  };

  return {
    cleanupTestDb,
    createTestAccount,
    createTestCategory,
    createUser,
    db,
    setupTestDb,
  };
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
