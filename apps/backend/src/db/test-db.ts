import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import {
  AccountType,
  OperationCreateDTO,
  TransactionCreate,
  UsersResponse,
  UUID,
} from '@ledgerly/shared/types';
import { createClient } from '@libsql/client';
import { sql, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { DataBase } from 'src/types';

import * as schema from './schemas';
import {
  accounts,
  categories,
  operations,
  transactions,
  users,
} from './schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class Counter {
  private count = 0;

  constructor(public name?: string) {}

  increment() {
    this.count += 1;
    return this.count;
  }

  getCount() {
    return this.count;
  }

  getNewCount() {
    this.increment();
    if (this.name) {
      return `${this.name}-${this.count}`;
    }

    return this.count.toString();
  }
}

export class TestDB {
  db: DataBase;
  transactionCounter = new Counter('transaction');
  operationCounter = new Counter('operation');
  userCounter = new Counter('user');

  constructor() {
    const client = createClient({
      url: 'file::memory:',
    });

    this.db = drizzle(client, { schema });
  }

  get uuid() {
    return crypto.randomUUID();
  }

  test = async () => {
    // try {
    //   const userTableResult = await this.db.all(
    //     sql`SELECT name FROM sqlite_master WHERE type='table' AND name='users';`,
    //   );
    //   console.info('result: ', userTableResult);
    //   if (userTableResult.length > 0) {
    //     console.info('✅ Users table exists');
    //     // Дополнительная проверка структуры таблицы users
    //     const tableInfo = await this.db.all(sql`PRAGMA table_info(users);`);
    //     console.info('📋 Users table structure:', tableInfo);
    //   } else {
    //     console.info('❌ Users table not found');
    //   }
    // } catch (error) {
    //   console.error('❌ Error checking users table:', error);
    // }

    try {
      const transactionTableResult = await this.db.all(
        sql`SELECT name FROM sqlite_master WHERE type='table' AND name='transactions';`,
      );
      console.info('result: ', transactionTableResult);
      if (transactionTableResult.length > 0) {
        console.info('✅ Transaction table exists');
        // Дополнительная проверка структуры таблицы transactions
        const tableInfo = await this.db.all(
          sql`PRAGMA table_info(transactions);`,
        );
        console.info('📋 Transactions table structure:', tableInfo);
      } else {
        console.info('❌ Transactions table not found');
      }
    } catch (error) {
      console.error('❌ Error checking transactions table:', error);
    }
  };

  async setupTestDb() {
    await this.db.run(sql`PRAGMA foreign_keys = ON;`);

    const migrationsFolder = join(__dirname, '../../drizzle');
    await migrate(this.db, { migrationsFolder });
  }

  async cleanupTestDb() {
    await this.db.run(sql`PRAGMA foreign_keys = OFF;`);

    const tables = Object.keys(schema);
    for (const table of tables) {
      await this.db.run(sql.raw(`DROP TABLE IF EXISTS ${table};`));
    }
  }

  createUser = async (params?: {
    email?: string;
    name?: string;
    password?: string;
  }): Promise<UsersResponse> => {
    const userData = {
      email: params?.email ?? `test-${Date.now()}@example.com`,
      name: params?.name ?? `Test User ${this.userCounter.getNewCount()}`,
      password: params?.password ?? 'test123',
    };

    const passwordManager = new PasswordManager();

    const hashedPassword = await passwordManager.hash(userData.password);

    const user = await this.db
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

  createTestAccount = async (
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

    const account = await this.db
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

  createTestCategory = (
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

    return this.db
      .insert(categories)
      .values({
        id: crypto.randomUUID(),
        ...categoryData,
      })
      .returning()
      .get();
  };

  testTransactionsTable = async () => {
    try {
      const tableCheck = await this.db.all(
        sql`SELECT name FROM sqlite_master WHERE type='table' AND name='transactions';`,
      );
      console.log('📋 Table check BEFORE transaction:', tableCheck);

      const allTables = await this.db.all(
        sql`SELECT name FROM sqlite_master WHERE type='table';`,
      );
      console.log(
        '📋 All tables:',
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        allTables.map((t) => t?.name),
      );
    } catch (error) {
      console.error('❌ Error checking tables BEFORE:', error);
    }
  };

  createTestOperations = async (params: {
    transactionId: UUID;
    userId: UUID;
    data: OperationCreateDTO[];
  }) => {
    const { data, transactionId, userId } = params;

    if (data.length === 0) {
      return null;
    }

    const operation = await this.db
      .insert(operations)
      .values(
        data.map((op) => ({
          ...op,
          transactionId,
          userId,
        })),
      )
      .returning()
      .all();

    return operation;
  };

  createTestTransaction = async (params: {
    userId: UUID;
    data?: TransactionCreate;
    operationData?: {
      accountId?: UUID;
      categoryId?: UUID;
      description?: string;
      localAmount?: number;
      originalAmount?: number;
      userId: UUID;
    }[];
  }) => {
    const { data, operationData = [], userId } = params;

    if (operationData.length > 0 && data && data.operations.length > 0) {
      throw new Error(
        'You cannot specify both operationData and operations in data',
      );
    }
    const transactionData: TransactionCreate = {
      description: this.transactionCounter.getNewCount(),
      operations: [],
      postingDate: new Date().toString(),
      transactionDate: new Date().toString(),
      ...data,
      userId,
    };

    const transaction = await this.db
      .insert(transactions)
      .values(transactionData)
      .returning()
      .get();

    const operationsResultFromTransaction = await this.createTestOperations({
      data: transactionData.operations,
      transactionId: transaction.id,
      userId,
    });

    const operationsResultOperationData = await this.createTestOperations({
      data: operationData.map((op) => ({
        accountId: op.accountId ?? this.uuid,
        categoryId: op.categoryId ?? this.uuid,
        description: op.description ?? this.operationCounter.getNewCount(),
        localAmount: op.localAmount ?? 0,
        originalAmount: op.originalAmount ?? 0,
        transactionId: transaction.id,
      })),
      transactionId: transaction.id,
      userId,
    });

    return {
      operations:
        operationsResultFromTransaction ?? operationsResultOperationData ?? [],
      transaction,
    };
  };

  getAllTransactions = async (userId: UUID) => {
    return this.db.transaction(async (tx) => {
      const transactionsList = await tx
        .select()
        .from(transactions)
        .where(eq(transactions.userId, userId))
        .all();

      return transactionsList;
    });
  };
}

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

  const createTestTransactionWithOperations = async (
    userId: UUID,
    params?: TransactionCreate,
  ) => {
    const transactionData: TransactionCreate = {
      description: 'Test transaction',
      operations: [],
      postingDate: new Date().toString(),
      transactionDate: new Date().toString(),
      ...params,
      userId,
    };

    const transactionWithOperations = await db.transaction(async (tx) => {
      const transaction = await tx
        .insert(transactions)
        .values(transactionData)
        .returning()
        .get();

      if (transactionData.operations.length === 0) {
        return { ...transaction, operations: [] };
      }

      const createdOperations = await tx
        .insert(operations)
        .values(
          transactionData.operations.map((op) => ({
            ...op,
            transactionId: transaction.id,
          })),
        )
        .returning();

      return { ...transaction, operations: createdOperations };
    });

    return transactionWithOperations;
  };

  return {
    cleanupTestDb,
    createTestAccount,
    createTestCategory,
    createTestTransaction: createTestTransactionWithOperations,
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
