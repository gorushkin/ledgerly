import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import { dateInIsoFormat } from '@ledgerly/shared/libs';
import {
  AccountTypeValue,
  CurrencyCode,
  IsoDateString,
  MoneyString,
  UUID,
} from '@ledgerly/shared/types';
import { isoDate, isoDatetime } from '@ledgerly/shared/validation';
import { createClient } from '@libsql/client';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { DataBase } from 'src/db';
import { Amount, Currency, DateValue } from 'src/domain/domain-core';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { AmountFormatter } from 'src/presentation/formatters';

import {
  EntryDbRow,
  TransactionDbInsert,
  TransactionDbRow,
  transactionsTable,
  accountsTable,
  usersTable,
  UserDbRow,
  TransactionWithRelations,
} from './schema';
import * as schema from './schemas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FILE_PREFIX = 'file:/tmp/test-';

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
  private testDbFile?: string;
  private client?: ReturnType<typeof createClient>;

  constructor(db?: DataBase) {
    if (db) {
      this.db = db;
      return;
    }

    this.testDbFile = `${FILE_PREFIX}${Date.now()}-${crypto.randomUUID()}.db`;

    // To use an in-memory database for faster, ephemeral tests, set url to 'file::memory:'.
    // The default below uses a file-based database, which persists data across test runs and can aid debugging.
    this.client = createClient({
      url: this.testDbFile,
    });

    this.db = drizzle(this.client, { schema });
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
    console.info('Running test checks on the test database...');

    try {
      const allTables = await this.db.all<{ name: string }>(
        sql`SELECT name 
        FROM sqlite_schema 
        WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`,
      );

      console.info('📋 All tables in the database:', allTables);
    } catch (error) {
      console.error('❌ Error retrieving tables:', error);
    }
  };

  async setupTestDb() {
    await this.db.run(sql`PRAGMA foreign_keys = ON;`);
    const migrationsFolder = join(__dirname, '../../drizzle');
    await migrate(this.db, { migrationsFolder });
  }

  async cleanupTestDb() {
    if (this.client) {
      try {
        this.client.close();
      } catch {
        /* empty */
      }
    }

    if (this.testDbFile?.startsWith(FILE_PREFIX)) {
      try {
        const fs = await import('fs/promises');
        const filePath = this.testDbFile.replace('file:', '');
        await fs.unlink(filePath);
      } catch {
        /* empty */
      }
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

  createEntry = async (
    userId: UUID,
    params?: {
      transactionId?: UUID;
      date?: IsoDateString;
      description?: string;
    },
  ): Promise<EntryDbRow> => {
    const transactionId =
      params?.transactionId ??
      (
        await this.createTransaction(userId, {
          description: `Entry Transaction ${this.transactionCounter.getNextName()}`,
          postingDate: TestDB.isoDateString,
          transactionDate: TestDB.isoDateString,
        })
      ).id;

    const description =
      params?.description ??
      `Test Entry ${this.transactionCounter.getNextName()}`;

    const entryData = {
      ...TestDB.uuid,
      ...TestDB.createTimestamps,
      date: params?.date ?? TestDB.isoDateString,
      description,
      userId,
      ...params,
      isTombstone: false,
      transactionId,
    };

    const entry = await this.db
      .insert(schema.entriesTable)
      .values(entryData)
      .returning()
      .get();

    return entry;
  };

  getEntryById = async (entryId: UUID): Promise<EntryDbRow | null> => {
    const entry = await this.db
      .select()
      .from(schema.entriesTable)
      .where(sql`${schema.entriesTable.id} = ${entryId}`)
      .get();

    return entry ?? null;
  };

  createTransaction = async (
    userId: UUID,
    params?: {
      description: string;
      postingDate: IsoDateString;
      transactionDate: IsoDateString;
    },
  ): Promise<TransactionDbRow> => {
    const transactionData: TransactionDbInsert = {
      ...TestDB.uuid,
      ...TestDB.createTimestamps,
      description:
        params?.description ??
        `Test Transaction ${this.transactionCounter.getNextName()}`,
      isTombstone: false,
      postingDate: DateValue.create().valueOf(),
      transactionDate: DateValue.create().valueOf(),
      ...params,
      userId,
    };

    const transaction = await this.db
      .insert(schema.transactionsTable)
      .values(transactionData)
      .returning()
      .get();

    return transaction;
  };

  getTransactionById = async (
    transactionId: UUID,
  ): Promise<TransactionDbRow | null> => {
    const transaction = await this.db
      .select()
      .from(schema.transactionsTable)
      .where(sql`${schema.transactionsTable.id} = ${transactionId}`)
      .get();

    return transaction ?? null;
  };

  getTransactionWithRelations = async (
    transactionId: UUID,
  ): Promise<TransactionWithRelations | null> => {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    const entries = await this.db
      .select()
      .from(schema.entriesTable)
      .where(sql`${schema.entriesTable.transactionId} = ${transactionId}`);

    const entriesWithOperations = await Promise.all(
      entries.map(async (entry) => {
        const operations = await this.db
          .select()
          .from(schema.operationsTable)
          .where(sql`${schema.operationsTable.entryId} = ${entry.id}`);

        return {
          ...entry,
          operations,
        };
      }),
    );

    return { entries: entriesWithOperations, ...transaction };
  };

  getTransactionInPTAFormat = async (
    transactionId: UUID,
  ): Promise<string | null> => {
    const transaction = await this.getTransactionById(transactionId);
    if (!transaction) return null;

    const entries = await this.db
      .select()
      .from(schema.entriesTable)
      .where(sql`${schema.entriesTable.transactionId} = ${transactionId}`);

    const entriesWithOperations = await Promise.all(
      entries.map(async (entry) => {
        const operations = await this.db
          .select()
          .from(schema.operationsTable)
          .where(sql`${schema.operationsTable.entryId} = ${entry.id}`);

        const operationsWithAccounts = await Promise.all(
          operations.map(async (operation) => {
            const account = await this.db
              .select()
              .from(schema.accountsTable)
              .where(sql`${schema.accountsTable.id} = ${operation.accountId}`)
              .get();

            return { ...operation, account };
          }),
        );

        return {
          ...entry,
          operations: operationsWithAccounts,
        };
      }),
    );

    // Format in PTA (Plain Text Accounting) style
    let output = `${transaction.transactionDate} ${transaction.description}\n`;

    for (const entry of entriesWithOperations) {
      output += `    Entry ID: ${entry.id}\n`;
      for (const operation of entry.operations) {
        if (!operation.account) continue;

        const formatter = new AmountFormatter();

        const amount = Amount.fromPersistence(operation.amount);
        const userFriendlyAmount = formatter.formatForTable(amount, 'en-US');
        const accountName = operation.account.name;
        const currency = operation.account.currency;
        const systemMarker = operation.isSystem ? ' [system]' : '';

        output += `    ${accountName.padEnd(40)} ${operation.description} ${userFriendlyAmount} ${currency}${systemMarker}\n`;
      }
    }

    return output;
  };

  softDeleteTransaction = async (transactionId: UUID) => {
    return await this.db
      .update(schema.transactionsTable)
      .set({ isTombstone: true })
      .where(sql`${schema.transactionsTable.id} = ${transactionId}`)
      .returning()
      .get();
  };

  createAccount = async (
    userId: UUID,
    params?: {
      name?: string;
      currency?: CurrencyCode;
      type?: AccountTypeValue;
      initialBalance?: MoneyString;
      description?: string;
      isSystem?: boolean;
    },
  ) => {
    const accountData = {
      currency: 'USD' as unknown as CurrencyCode,
      description: '',
      initialBalance: Amount.create('0').valueOf(),
      isSystem: false,
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
        isSystem: accountData.isSystem,
      })
      .returning()
      .get();

    return account;
  };

  createOperation = async (
    userId: UUID,
    params: {
      accountId: UUID;
      description: string;
      entryId: UUID;
      amount: MoneyString;
      isSystem?: boolean;
    },
  ) => {
    const operationData = {
      isSystem: params.isSystem ?? false,
      ...TestDB.uuid,
      ...TestDB.createTimestamps,
      ...params,
      isTombstone: false,
      userId,
    };

    const operation = await this.db
      .insert(schema.operationsTable)
      .values(operationData)
      .returning()
      .get();

    return operation;
  };

  getOperationsByAccountId = async (userId: UUID, accountId: UUID) => {
    const operations = await this.db
      .select()
      .from(schema.operationsTable)
      .where(
        sql`${schema.operationsTable.accountId} = ${accountId} AND ${schema.operationsTable.userId} = ${userId}`,
      );

    return operations;
  };

  getOperationById = async (operationId: UUID) => {
    const operation = await this.db
      .select()
      .from(schema.operationsTable)
      .where(sql`${schema.operationsTable.id} = ${operationId}`)
      .get();

    return operation ?? null;
  };

  deleteData = async () => {
    await this.db.delete(transactionsTable);
    await this.db.delete(accountsTable);
    await this.db.delete(usersTable);
  };

  seedTestData = async (initUser?: UserDbRow) => {
    const user =
      initUser ??
      (await this.createUser({
        email: 'test@example4.com',
        name: 'Ivan',
        password: 'hashed_password',
      }));

    const accountUSD1 = await this.createAccount(user.id, {
      currency: Currency.create('USD').valueOf(),
      name: 'Savings Account USD',
    });

    const accountUSD2 = await this.createAccount(user.id, {
      currency: Currency.create('USD').valueOf(),
      name: 'Checking Account USD',
    });

    const accountEUR = await this.createAccount(user.id, {
      currency: Currency.create('EUR').valueOf(),
      name: 'Credit Card EUR',
    });

    const transaction1 = await this.createTransaction(user.id);
    const transaction2 = await this.createTransaction(user.id);

    const entry1Transaction1 = await this.createEntry(user.id, {
      transactionId: transaction1.id,
    });

    const entry2Transaction1 = await this.createEntry(user.id, {
      transactionId: transaction1.id,
    });

    const entry1Transaction2 = await this.createEntry(user.id, {
      transactionId: transaction2.id,
    });

    await this.createOperation(user.id, {
      accountId: accountUSD1.id,
      amount: Amount.create('10000').valueOf(),
      description: 'Initial Deposit',
      entryId: entry1Transaction1.id,
    });

    await this.createOperation(user.id, {
      accountId: accountUSD2.id,
      amount: Amount.create('-5000').valueOf(),
      description: 'Grocery Shopping',
      entryId: entry1Transaction1.id,
    });

    await this.createOperation(user.id, {
      accountId: accountEUR.id,
      amount: Amount.create('2000').valueOf(),
      description: 'Credit Card Payment',
      entryId: entry2Transaction1.id,
    });

    await this.createOperation(user.id, {
      accountId: accountUSD1.id,
      amount: Amount.create('-2000').valueOf(),
      description: 'Utility Bill',
      entryId: entry2Transaction1.id,
    });

    await this.createOperation(user.id, {
      accountId: accountUSD1.id,
      amount: Amount.create('15000').valueOf(),
      description: 'Salary',
      entryId: entry1Transaction2.id,
    });

    await this.createOperation(user.id, {
      accountId: accountUSD2.id,
      amount: Amount.create('-15000').valueOf(),
      description: 'Rent Payment',
      entryId: entry1Transaction2.id,
    });

    return {
      account1: accountUSD1,
      account2: accountUSD2,
      account3: accountEUR,
      transaction1,
      transaction2,
      user,
    };
  };

  getDatabaseInfo = async () => {
    const tables = await this.db.all<{ name: string }>(
      sql`SELECT name 
      FROM sqlite_schema 
      WHERE type = 'table' AND name NOT LIKE 'sqlite_%';`,
    );

    const info: Record<string, number> = {};

    for (const table of tables) {
      const countResult = await this.db
        .select({ count: sql`count(*)` })
        .from(sql.raw(table.name))
        .get();

      if (countResult && table.name) {
        info[table.name] = Number(countResult.count);
      }
    }
    console.info(info);
  };

  getAllOperations = async () => {
    return this.db.select().from(schema.operationsTable);
  };
}
