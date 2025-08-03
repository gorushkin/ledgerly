import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import {
  AccountType,
  OperationCreateDTO,
  OperationResponseDTO,
  TransactionDbRecordDTO,
  TransactionDbRowDTO,
  TransactionResponseDTO,
  UsersResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { createClient } from '@libsql/client';
import { sql, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { generateId } from 'src/libs';
import { getTransactionWithHash } from 'src/libs/hashGenerator';
import { DataBase } from 'src/types';

import * as schema from './schemas';
import {
  accountsTable,
  categoriesTable,
  operationsTable,
  transactionsTable,
  usersTable,
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

  getNextName(suffix = ''): string {
    this.increment();
    if (this.name) {
      return `${this.name}-${this.count}${suffix ? `-${suffix}` : ''}`;
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
  }): Promise<UsersResponseDTO> => {
    const userData = {
      email: params?.email ?? `test-${Date.now()}@example.com`,
      name: params?.name ?? `Test User ${this.userCounter.getNextName()}`,
      password: params?.password ?? 'test123',
    };

    const passwordManager = new PasswordManager();

    const hashedPassword = await passwordManager.hash(userData.password);

    const user = await this.db
      .insert(usersTable)
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
      initialBalance?: number;
    },
  ) => {
    const accountData = {
      initialBalance: 0,
      name: 'Test Account',
      originalCurrency: 'USD',
      type: ACCOUNT_TYPES[0],
      ...params,
      userId,
    };

    const account = await this.db
      .insert(accountsTable)
      .values({
        balance: accountData.initialBalance ?? 0,
        initialBalance: accountData.initialBalance ?? 0,
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
      .insert(categoriesTable)
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

  createTestTransaction = async (params: {
    userId: UUID;
    data?: {
      description?: string;
      postingDate: string;
      transactionDate: string;
      userId: UUID;
      operations?: OperationCreateDTO[];
    };
  }): Promise<TransactionDbRowDTO> => {
    const { data, userId } = params;

    const transactionData = {
      description: this.transactionCounter.getNextName(userId),
      id: generateId(),
      postingDate: new Date().toString(),
      transactionDate: new Date().toString(),
      ...data,
      userId,
    };

    const transaction = await this.db
      .insert(transactionsTable)
      .values(getTransactionWithHash(transactionData))
      .returning()
      .get();

    return transaction;
  };

  getOperationsByTransactionIds = async (
    transactionsList: Omit<TransactionResponseDTO, 'operations'>[],
  ): Promise<TransactionResponseDTO[]> => {
    const transactionResponseMap = new Map<UUID, TransactionResponseDTO>();

    const ids = transactionsList.map((transaction) => {
      transactionResponseMap.set(transaction.id, {
        ...transaction,
        operations: [],
      });
      return transaction.id;
    });

    if (ids.length === 0) return [];

    const operations = await this.db
      .select()
      .from(operationsTable)
      .where(inArray(operationsTable.transactionId, ids))
      .all();

    operations.forEach((op) => {
      const transaction = transactionResponseMap.get(op.transactionId);
      if (transaction) {
        transaction.operations.push(op);
      }
    });

    return Array.from(transactionResponseMap.values());
  };

  getOperationsByTransactionId = async (
    transactionId: UUID,
  ): Promise<OperationResponseDTO[]> => {
    const operationsList = await this.db
      .select()
      .from(operationsTable)
      .where(eq(operationsTable.transactionId, transactionId))
      .all();

    return operationsList;
  };

  getAllTransactions = async (): Promise<TransactionDbRecordDTO[]> => {
    const transactionsList = await this.db
      .select()
      .from(transactionsTable)
      .all();

    return transactionsList;
  };

  getAllAggregatedTransactions = async (): Promise<
    TransactionResponseDTO[]
  > => {
    const transactionsList = await this.db
      .select()
      .from(transactionsTable)
      .all();

    return this.getOperationsByTransactionIds(transactionsList);
  };

  getTransactionById = async (
    transactionId: UUID,
  ): Promise<TransactionDbRowDTO | undefined> => {
    const transaction = await this.db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.id, transactionId))
      .get();

    return transaction;
  };

  getAllTransactionsByUserId = async (
    userId: UUID,
  ): Promise<TransactionResponseDTO[]> => {
    const transactionsList = await this.db
      .select()
      .from(transactionsTable)
      .where(eq(transactionsTable.userId, userId))
      .all();

    return this.getOperationsByTransactionIds(transactionsList);
  };
}
