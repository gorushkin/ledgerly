import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import {
  AccountType,
  OperationInsertDTO,
  TransactionDbInsertDTO,
  TransactionDbRowDTO,
  UsersResponseDTO,
  UUID,
} from '@ledgerly/shared/types';
import { createClient } from '@libsql/client';
import { sql, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { generateId } from 'src/libs';
import { getTransactionWithHash } from 'src/libs/hashGenerator';
import { DataBase } from 'src/types';

import * as schema from './schemas';
import { accountsTable, transactionsTable, usersTable } from './schemas';
import { seedCurrencies } from './scripts/currenciesSeed';

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
    await seedCurrencies(this.db);
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

  createAccount = async (
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
        currentClearedBalanceLocal: accountData.initialBalance ?? 0,
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

  createOperation = async (params: {
    userId: UUID;
    accountId: UUID;
    transactionId: UUID;
    description?: string;
  }) => {
    const operationData: OperationInsertDTO = {
      accountId: params.accountId,
      baseAmount: 100,
      createdAt: new Date().toISOString(),
      description: params.description ?? 'Test Operation',
      hash: `hash-${this.operationCounter.getNextName()}`,
      id: this.uuid,
      localAmount: 100,
      rateBasePerLocal: '1.0',
      transactionId: params.transactionId,
      updatedAt: new Date().toISOString(),
      userId: params.userId,
    };

    const operation = await this.db
      .insert(schema.operationsTable) // Assuming 'operations' is the correct table name
      .values(operationData)
      .returning()
      .get();

    return operation;
  };

  createTransaction = async (params: {
    userId: UUID;
    data?: {
      description?: string;
      postingDate: string;
      transactionDate: string;
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

  getAllTransactions = async (): Promise<TransactionDbInsertDTO[]> => {
    const transactionsList = await this.db
      .select()
      .from(transactionsTable)
      .all();

    return transactionsList;
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

  getOperationsByTransactionId = async (
    transactionId: UUID,
  ): Promise<OperationInsertDTO[]> => {
    const operations = await this.db
      .select()
      .from(schema.operationsTable)
      .where(eq(schema.operationsTable.transactionId, transactionId))
      .all();

    return operations;
  };

  getAllOperations = async (): Promise<OperationInsertDTO[]> => {
    const operations = await this.db
      .select()
      .from(schema.operationsTable)
      .all();

    return operations;
  };
}
