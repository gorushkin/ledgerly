import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import { dateInIsoFormat } from '@ledgerly/shared/libs';
import {
  AccountType,
  CurrencyCode,
  IsoDateString,
  Money,
  MoneyString,
  UUID,
} from '@ledgerly/shared/types';
import { isoDate, isoDatetime } from '@ledgerly/shared/validation';
import { createClient } from '@libsql/client';
import { sql, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { DataBase } from 'src/types';

import { OperationDbInsert, TransactionDbRow, UserDbRow } from './schema';
import * as schema from './schemas';
import { accountsTable, usersTable } from './schemas';
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

  static get createTimestamps() {
    const now = isoDatetime.parse(new Date().toISOString());
    return { createdAt: now, updatedAt: now };
  }

  static get updateTimestamp() {
    const now = isoDatetime.parse(new Date().toISOString());
    return { updatedAt: now };
  }

  static get isoDateString() {
    return isoDate.parse(dateInIsoFormat);
  }

  static get uuid() {
    return { id: crypto.randomUUID() as UUID };
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
  }): Promise<UserDbRow> => {
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
        ...TestDB.uuid,
        name: userData.name,
        password: hashedPassword,
        ...TestDB.createTimestamps,
      })
      .returning()
      .get();

    return user;
  };

  createAccount = async (
    userId: UUID,
    params?: {
      name?: string;
      currency?: CurrencyCode;
      type?: AccountType;
      initialBalance?: MoneyString;
      description?: string;
    },
  ) => {
    const accountData = {
      currency: 'USD' as unknown as CurrencyCode,
      description: '',
      initialBalance: 0,
      name: 'Test Account',
      type: ACCOUNT_TYPES[0],
      ...params,
      userId,
    };

    const account = await this.db
      .insert(accountsTable)
      .values({
        currency: accountData.currency,
        currentClearedBalanceLocal: accountData.initialBalance ?? 0,
        description: accountData.description || '',
        initialBalance: accountData.initialBalance ?? 0,
        isTombstone: false,
        name: accountData.name,
        type: accountData.type,
        userId: accountData.userId,
        ...TestDB.createTimestamps,
        ...TestDB.uuid,
      })
      .returning()
      .get();

    return account;
  };

  createTransaction = async (params: {
    userId: UUID;
    description?: string;
    postingDate?: IsoDateString;
    transactionDate?: IsoDateString;
  }): Promise<TransactionDbRow> => {
    const transactionData = {
      description: `Test Transaction ${this.transactionCounter.getNextName()}`,
      postingDate: TestDB.isoDateString,
      transactionDate: TestDB.isoDateString,
      ...params,
      ...TestDB.createTimestamps,
      ...TestDB.uuid,
      hash: `hash-${this.transactionCounter.getNextName()}`,
      userId: params.userId,
    };

    const result = this.db
      .insert(schema.transactionsTable)
      .values(transactionData)
      .returning()
      .get();

    return result;
  };

  getTransactionById = async (
    id: UUID,
  ): Promise<TransactionDbRow | undefined> => {
    const transaction = await this.db
      .select()
      .from(schema.transactionsTable)
      .where(eq(schema.transactionsTable.id, id))
      .get();

    return transaction;
  };

  updateTransaction = async (
    id: UUID,
    updates: Partial<{
      description: string;
      postingDate?: IsoDateString;
      transactionDate?: IsoDateString;
      hash: string;
      isTombstone: boolean;
    }>,
  ): Promise<TransactionDbRow> => {
    const updatedTransaction = await this.db
      .update(schema.transactionsTable)
      .set({
        ...updates,
        ...TestDB.updateTimestamp,
      })
      .where(eq(schema.transactionsTable.id, id))
      .returning()
      .get();

    return updatedTransaction;
  };

  createOperation = async (params: {
    accountId: UUID;
    amountLocal?: number;
    transactionId: UUID;
    description?: string;
    category?: string;
    userId?: UUID;
    rateBasePerLocal?: number;
    isTombstone?: boolean;
  }) => {
    const operationData = {
      amount: 100 as Money,
      category: 'Test Category',
      description: `Test Operation ${this.operationCounter.getNextName()}`,
      isTombstone: !!params.isTombstone,
      ...params,
      transactionId: params.transactionId ?? crypto.randomUUID(),
      userId: params.userId ?? crypto.randomUUID(),
      ...TestDB.createTimestamps,
      ...TestDB.uuid,
    };

    const operation = await this.db
      .insert(schema.operationsTable)
      .values(operationData)
      .returning()
      .get();

    return operation;
  };

  getOperationsByTransactionId = async (
    transactionId: UUID,
  ): Promise<OperationDbInsert[]> => {
    const operations = await this.db
      .select()
      .from(schema.operationsTable)
      .where(eq(schema.operationsTable.transactionId, transactionId));

    return operations;
  };

  getOperationById = async (
    id: UUID,
  ): Promise<OperationDbInsert | undefined> => {
    const operation = await this.db
      .select()
      .from(schema.operationsTable)
      .where(eq(schema.operationsTable.id, id))
      .get();

    return operation;
  };
}
