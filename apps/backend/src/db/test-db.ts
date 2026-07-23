import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { ACCOUNT_TYPES } from '@ledgerly/shared/constants';
import { dateInIsoFormat } from '@ledgerly/shared/libs';
import {
  AccountTypeValue,
  IsoDateString,
  AmountString,
  UUID,
  CommodityCodeString,
  CommodityPrecisionNumber,
  CommoditySymbolString,
} from '@ledgerly/shared/types';
import { isoDate, isoDatetime } from '@ledgerly/shared/validation';
import { createClient } from '@libsql/client';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { DataBase } from 'src/db';
import { Amount, CommodityCode, DateValue } from 'src/domain/domain-core';
import { OperationSnapshot } from 'src/domain/operations/types';
import { TransactionSnapshot } from 'src/domain/transactions/types';
import { PasswordManager } from 'src/infrastructure/auth/PasswordManager';
import { CommodityPersistenceMapper } from 'src/infrastructure/db/commodities/commodity-persistence.mapper';

import {
  TransactionDbInsert,
  TransactionDbRow,
  transactionsTable,
  accountsTable,
  usersTable,
  UserDbRow,
  TransactionWithRelations,
  AccountDbInsert,
  OperationDbInsert,
  OperationDbRow,
  CommodityDbInsert,
  commoditiesTable,
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

  getNextName({
    delimiter = '-',
    suffix = '',
  }: { suffix?: string; delimiter?: string } = {}): string {
    this.increment();
    if (this.name) {
      return `${this.name}${delimiter}${this.count}${suffix ? `${delimiter}${suffix}` : ''}`;
    }

    return this.count.toString();
  }
}
export type CreateTransactionProps = {
  description?: string;
  postingDate?: IsoDateString;
  transactionDate?: IsoDateString;
  isTombstone?: boolean;
};

export type TransactionOperationSeed = {
  account: {
    id: UUID;
  };
  amount: string;
  description: string;
  value?: string;
  isTombstone?: boolean;
};

export type TransactionSeed = {
  description: string;
  operations: TransactionOperationSeed[];
  postingDate?: IsoDateString;
  transactionDate?: IsoDateString;
  isTombstone?: boolean;
};

export class TestDB {
  db: DataBase;
  transactionCounter = new Counter('transaction');
  commodityCounter = new Counter('commodity');
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

  createTransaction = async (
    userId: UUID,
    commodityId: UUID,
    params?: CreateTransactionProps,
  ): Promise<TransactionDbRow> => {
    const transactionData: TransactionDbInsert = {
      ...TestDB.uuid,
      ...TestDB.createTimestamps,
      description:
        params?.description ??
        `Test Transaction ${this.transactionCounter.getNextName()}`,
      isTombstone: params?.isTombstone ?? false,
      postingDate: params?.postingDate ?? DateValue.create().valueOf(),
      transactionDate: params?.transactionDate ?? DateValue.create().valueOf(),
      ...params,
      commodityId,
      userId,
      version: 0,
    };

    const transaction = await this.db
      .insert(schema.transactionsTable)
      .values(transactionData)
      .returning()
      .get();

    return transaction;
  };

  createTransactionWithOperations = async (
    userId: UUID,
    commodityId: UUID,
    params?: {
      description?: string;
      postingDate?: IsoDateString;
      transactionDate?: IsoDateString;
      isTombstone?: boolean;
      operations: {
        accountId: UUID;
        description: string;
        transactionId?: UUID;
        amount: AmountString;
        value: AmountString;
        isSystem?: boolean;
        isTombstone?: boolean;
        id: UUID;
      }[];
    },
  ): Promise<TransactionWithRelations> => {
    const transaction = await this.createTransaction(
      userId,
      commodityId,
      params,
    );

    const operations: OperationDbRow[] = [];

    for (const operationParams of params?.operations ?? []) {
      const operation = await this.createOperation(userId, {
        ...operationParams,
        transactionId: transaction.id,
      });

      operations.push(operation);
    }

    return { ...transaction, operations };
  };

  createTransactionFromSeed = async (
    userId: UUID,
    commodityId: UUID,
    {
      description,
      isTombstone = false,
      operations,
      postingDate = '2023-01-01' as IsoDateString,
      transactionDate = '2023-01-01' as IsoDateString,
    }: TransactionSeed,
  ): Promise<TransactionWithRelations> => {
    return this.createTransactionWithOperations(userId, commodityId, {
      description,
      isTombstone,
      operations: operations.map((operation) => ({
        accountId: operation.account.id,
        amount: Amount.create(operation.amount).valueOf(),
        description: operation.description,
        id: crypto.randomUUID() as UUID,
        isSystem: false,
        isTombstone: operation.isTombstone ?? false,
        value: Amount.create(operation.value ?? operation.amount).valueOf(),
      })),
      postingDate,
      transactionDate,
    });
  };

  createOperation = async (
    userId: UUID,
    params?: {
      accountId?: UUID;
      description?: string;
      transactionId: UUID;
      id?: UUID;
      amount?: AmountString;
      value?: AmountString;
      isSystem?: boolean;
      isTombstone?: boolean;
    },
  ) => {
    const operationData: OperationDbInsert = {
      isSystem: params?.isSystem ?? false,
      ...TestDB.uuid,
      ...TestDB.createTimestamps,
      amount: params?.amount ?? Amount.create('1000').valueOf(),
      ...params,
      accountId: params?.accountId ?? (crypto.randomUUID() as UUID),
      description:
        params?.description ??
        `Test Operation ${this.operationCounter.getNextName()}`,
      id: params?.id ?? (crypto.randomUUID() as UUID),
      isTombstone: params?.isTombstone ?? false,
      transactionId: params?.transactionId ?? (crypto.randomUUID() as UUID),
      userId,
      value: params?.value ?? Amount.create('1000').valueOf(),
    };

    const operation = await this.db
      .insert(schema.operationsTable)
      .values(operationData)
      .returning()
      .get();

    return operation;
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

    const operations = await this.db
      .select()
      .from(schema.operationsTable)
      .where(sql`${schema.operationsTable.transactionId} = ${transactionId}`);

    return { operations, ...transaction };
  };

  softDeleteTransaction = async (transactionId: UUID) => {
    return await this.db
      .update(schema.transactionsTable)
      .set({ isTombstone: true })
      .where(sql`${schema.transactionsTable.id} = ${transactionId}`)
      .returning()
      .get();
  };

  createCommodity = async (
    userId: UUID,
    params?: {
      code?: CommodityCodeString;
      symbol?: CommoditySymbolString;
      name?: string;
      precision?: CommodityPrecisionNumber;
    },
  ) => {
    const commodityData = {
      code:
        params?.code ??
        CommodityCode.create(
          `COM${this.commodityCounter.getNextName({ delimiter: '' })}`,
        ).valueOf(),
      name:
        params?.name ?? `Commodity ${this.transactionCounter.getNextName()}`,
      precision: params?.precision ?? 2,
      symbol: params?.symbol ?? `${this.commodityCounter.getNextName()}`,
      userId,
    };

    const commodity = await this.db
      .insert(schema.commoditiesTable)
      .values({
        code: commodityData.code,
        name: commodityData.name,
        precision: commodityData.precision,
        symbol: commodityData.symbol,
        userId: commodityData.userId,
        ...TestDB.createTimestamps,
        ...TestDB.uuid,
        isTombstone: false,
      })
      .returning()
      .get();

    return commodity;
  };

  createAccount = async (
    userId: UUID,
    commodityId: UUID,
    params?: {
      name?: string;
      type?: AccountTypeValue;
      initialBalance?: AmountString;
      description?: string;
      isSystem?: boolean;
    },
  ) => {
    const accountData = {
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
        commodityId,
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

  insertCommodity = async (commodityData: CommodityDbInsert) => {
    const insertedCommodity = await this.db
      .insert(commoditiesTable)
      .values(commodityData)
      .returning()
      .get();

    return insertedCommodity;
  };

  insertAccount = async (accountData: AccountDbInsert) => {
    const account = await this.db
      .insert(accountsTable)
      .values(accountData)
      .returning()
      .get();

    return account;
  };

  insertOperation = async (operationData: OperationSnapshot) => {
    const operation = await this.db
      .insert(schema.operationsTable)
      .values(operationData)
      .returning()
      .get();

    return operation;
  };

  insertTransaction = async (
    transactionData: TransactionSnapshot,
  ): Promise<TransactionWithRelations> => {
    const transaction = await this.db
      .insert(transactionsTable)
      .values(transactionData)
      .returning()
      .get();

    const operations = await Promise.all(
      transactionData.operations.map((operation) =>
        this.insertOperation({
          ...operation,
          transactionId: transaction.id,
        }),
      ),
    );

    return { ...transaction, operations };
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

  getOperationsByTransactionId = async (userId: UUID, transactionId: UUID) => {
    const operations = await this.db
      .select()
      .from(schema.operationsTable)
      .where(
        sql`${schema.operationsTable.transactionId} = ${transactionId} AND ${schema.operationsTable.userId} = ${userId}`,
      );

    return operations;
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

    const transactionCommodity = CommodityPersistenceMapper.toDomain(
      await this.createCommodity(user.id),
    );

    const usdCommodity = await this.createCommodity(user.id, {
      code: CommodityCode.create('USD').valueOf(),
      name: 'US Dollar',
      precision: 2,
      symbol: '$',
    });

    const eurCommodity = await this.createCommodity(user.id, {
      code: CommodityCode.create('EUR').valueOf(),
      name: 'Euro',
      precision: 2,
      symbol: '€',
    });

    const accountUSD1 = await this.createAccount(user.id, usdCommodity.id, {
      name: 'Savings Account USD',
    });

    const accountUSD2 = await this.createAccount(user.id, usdCommodity.id, {
      name: 'Checking Account USD',
    });

    const accountEUR = await this.createAccount(user.id, eurCommodity.id, {
      name: 'Credit Card EUR',
    });

    const transaction1 = await this.createTransaction(
      user.id,
      transactionCommodity.getId().valueOf(),
    );
    const transaction2 = await this.createTransaction(
      user.id,
      transactionCommodity.getId().valueOf(),
    );

    await this.createOperation(user.id, {
      accountId: accountUSD1.id,
      amount: Amount.create('10000').valueOf(),
      description: 'Initial Deposit',
      transactionId: transaction1.id,
      value: Amount.create('10000').valueOf(),
    });

    await this.createOperation(user.id, {
      accountId: accountUSD2.id,
      amount: Amount.create('-5000').valueOf(),
      description: 'Grocery Shopping',
      transactionId: transaction1.id,
      value: Amount.create('-5000').valueOf(),
    });

    await this.createOperation(user.id, {
      accountId: accountEUR.id,
      amount: Amount.create('2000').valueOf(),
      description: 'Credit Card Payment',
      transactionId: transaction1.id,
      value: Amount.create('2000').valueOf(),
    });

    await this.createOperation(user.id, {
      accountId: accountUSD1.id,
      amount: Amount.create('-2000').valueOf(),
      description: 'Utility Bill',
      transactionId: transaction1.id,
      value: Amount.create('-2000').valueOf(),
    });

    await this.createOperation(user.id, {
      accountId: accountUSD1.id,
      amount: Amount.create('15000').valueOf(),
      description: 'Salary',
      transactionId: transaction2.id,
      value: Amount.create('15000').valueOf(),
    });

    await this.createOperation(user.id, {
      accountId: accountUSD2.id,
      amount: Amount.create('-15000').valueOf(),
      description: 'Rent Payment',
      transactionId: transaction2.id,
      value: Amount.create('-15000').valueOf(),
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

  getAllTransactionByUserId = async (
    userId: UUID,
  ): Promise<TransactionWithRelations[]> => {
    return await this.db.query.transactionsTable.findMany({
      where: eq(transactionsTable.userId, userId),
      with: {
        operations: true,
      },
    });
  };
}
