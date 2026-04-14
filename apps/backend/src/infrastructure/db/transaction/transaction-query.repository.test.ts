import {
  CurrencyCode,
  IsoDateString,
  MoneyString,
  UUID,
} from '@ledgerly/shared/types';
import { UserDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionManager, TransactionQueryRepository } from '../';

type TestAccount = {
  id: UUID;
  currency: CurrencyCode;
};

type OperationSeed = {
  account: TestAccount;
  amount: MoneyString;
  description: string;
  value?: MoneyString;
};

type TransactionSeed = {
  currencyCode?: CurrencyCode;
  description: string;
  operations: OperationSeed[];
  postingDate?: IsoDateString;
  transactionDate?: IsoDateString;
};

describe('TransactionQueryRepository', () => {
  let testDB: TestDB;
  let transactionQueryRepo: TransactionQueryRepository;
  let user: UserDbRow;
  let usdAccount: TestAccount;
  let eurAccount: TestAccount;

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  const createAccount = async (
    currency: CurrencyCode,
    name: string,
  ): Promise<TestAccount> => {
    const account = await testDB.createAccount(user.id, {
      currency,
      name,
    });

    return {
      currency: account.currency,
      id: account.id,
    };
  };

  const createTransaction = async ({
    currencyCode = 'USD' as CurrencyCode,
    description,
    operations,
    postingDate = '2023-01-01' as IsoDateString,
    transactionDate = '2023-01-01' as IsoDateString,
  }: {
    currencyCode?: CurrencyCode;
    description: string;
    operations: OperationSeed[];
    postingDate?: IsoDateString;
    transactionDate?: IsoDateString;
  }) => {
    return testDB.createTransactionWithOperations(user.id, {
      currencyCode,
      description,
      operations: operations.map((operation) => ({
        accountId: operation.account.id,
        amount: operation.amount,
        description: operation.description,
        id: crypto.randomUUID() as UUID,
        isSystem: false,
        transactionId: crypto.randomUUID() as UUID,
        value: operation.value ?? operation.amount,
      })),
      postingDate,
      transactionDate,
    });
  };

  const expectTransactionToMatchSeed = (
    transaction: Awaited<ReturnType<TransactionQueryRepository['findById']>>,
    seed: TransactionSeed,
  ) => {
    expect(transaction).not.toBeNull();

    if (!transaction) {
      return;
    }

    expect(transaction.currency).toBe(seed.currencyCode ?? 'USD');
    expect(transaction.description).toBe(seed.description);
    expect(transaction.postingDate).toBe(seed.postingDate ?? '2023-01-01');
    expect(transaction.transactionDate).toBe(
      seed.transactionDate ?? '2023-01-01',
    );
    expect(transaction.userId).toBe(user.id);
    expect(transaction.operations).toHaveLength(seed.operations.length);

    transaction.operations.forEach((operation, operationIndex) => {
      const operationSeed = seed.operations[operationIndex];

      expect(operation.accountId).toBe(operationSeed.account.id);
      expect(operation.amount).toBe(operationSeed.amount);
      expect(operation.value).toBe(operationSeed.value ?? operationSeed.amount);
      expect(operation.description).toBe(operationSeed.description);
      expect(operation.userId).toBe(user.id);
      expect(operation.transactionId).toBe(transaction.id);
      expect(operation.isSystem).toBe(false);
    });
  };

  beforeEach(async () => {
    testDB = new TestDB();
    await testDB.setupTestDb();

    user = await testDB.createUser();
    usdAccount = await createAccount('USD' as CurrencyCode, 'Cash USD');
    eurAccount = await createAccount('EUR' as CurrencyCode, 'Cash EUR');

    transactionQueryRepo = new TransactionQueryRepository(
      transactionManager as unknown as TransactionManager,
    );
  });

  describe('findAll', () => {
    it('should return all user transactions with operations', async () => {
      const transactionSeeds: TransactionSeed[] = [
        {
          description: 'Salary',
          operations: [
            {
              account: usdAccount,
              amount: '-2000' as MoneyString,
              description: 'Salary debit',
            },
            {
              account: usdAccount,
              amount: '2000' as MoneyString,
              description: 'Salary credit',
            },
          ],
        },
        {
          description: 'Groceries',
          operations: [
            {
              account: usdAccount,
              amount: '-150' as MoneyString,
              description: 'Groceries expense',
            },
            {
              account: eurAccount,
              amount: '150' as MoneyString,
              description: 'Groceries offset',
            },
          ],
          postingDate: '2023-01-02' as IsoDateString,
          transactionDate: '2023-01-02' as IsoDateString,
        },
        {
          currencyCode: 'EUR' as CurrencyCode,
          description: 'Transfer',
          operations: [
            {
              account: eurAccount,
              amount: '-500' as MoneyString,
              description: 'Transfer out',
            },
            {
              account: eurAccount,
              amount: '500' as MoneyString,
              description: 'Transfer in',
            },
          ],
          postingDate: '2023-01-03' as IsoDateString,
          transactionDate: '2023-01-03' as IsoDateString,
        },
      ];

      await Promise.all(
        transactionSeeds.map((transactionSeed) =>
          createTransaction(transactionSeed),
        ),
      );

      const transactions = await transactionQueryRepo.findAll(user.id);

      expect(transactions).toHaveLength(transactionSeeds.length);

      transactions.forEach((transaction, index) => {
        const seed = transactionSeeds[index];
        expectTransactionToMatchSeed(transaction, seed);
      });
    });
  });

  describe('findById', () => {
    it('should return transaction by id with operations', async () => {
      const transactionSeed: TransactionSeed = {
        currencyCode: 'EUR' as CurrencyCode,
        description: 'Exchange',
        operations: [
          {
            account: usdAccount,
            amount: '-1000' as MoneyString,
            description: 'Exchange USD out',
          },
          {
            account: eurAccount,
            amount: '920' as MoneyString,
            description: 'Exchange EUR in',
            value: '920' as MoneyString,
          },
        ],
        postingDate: '2023-02-10' as IsoDateString,
        transactionDate: '2023-02-10' as IsoDateString,
      };

      const insertedTransaction = await createTransaction(transactionSeed);

      const transaction = await transactionQueryRepo.findById(
        user.id,
        insertedTransaction.id,
      );

      expectTransactionToMatchSeed(transaction, transactionSeed);
      expect(transaction?.id).toBe(insertedTransaction.id);
    });

    it('should return null when transaction does not exist', async () => {
      const transaction = await transactionQueryRepo.findById(
        user.id,
        crypto.randomUUID() as UUID,
      );

      expect(transaction).toBeNull();
    });

    it('should return null when transaction belongs to another user', async () => {
      const transactionSeed: TransactionSeed = {
        description: 'Private transfer',
        operations: [
          {
            account: usdAccount,
            amount: '-300' as MoneyString,
            description: 'Private transfer out',
          },
          {
            account: usdAccount,
            amount: '300' as MoneyString,
            description: 'Private transfer in',
          },
        ],
      };

      const insertedTransaction = await createTransaction(transactionSeed);
      const anotherUser = await testDB.createUser();

      const transaction = await transactionQueryRepo.findById(
        anotherUser.id,
        insertedTransaction.id,
      );

      expect(transaction).toBeNull();
    });
  });
});
