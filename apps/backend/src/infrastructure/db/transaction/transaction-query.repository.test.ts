import { DEFAULT_TRANSACTION_QUERY } from '@ledgerly/shared/constants';
import { CurrencyCode, IsoDateString, UUID } from '@ledgerly/shared/types';
import { UserDbRow } from 'src/db/schema';
import { TestDB, TransactionSeed } from 'src/db/test-db';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TransactionManager, TransactionQueryRepository } from '../';

type TestAccount = {
  id: UUID;
  currency: CurrencyCode;
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

  const createTransaction = (seed: TransactionSeed) =>
    testDB.createTransactionFromSeed(user.id, seed);

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
              amount: '-2000',
              description: 'Salary debit',
            },
            {
              account: usdAccount,
              amount: '2000',
              description: 'Salary credit',
            },
          ],
        },
        {
          description: 'Groceries',
          operations: [
            {
              account: usdAccount,
              amount: '-150',
              description: 'Groceries expense',
            },
            {
              account: eurAccount,
              amount: '150',
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
              amount: '-500',
              description: 'Transfer out',
            },
            {
              account: eurAccount,
              amount: '500',
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

      const result = await transactionQueryRepo.findAll(
        user.id,
        DEFAULT_TRANSACTION_QUERY,
      );

      expect(result.items).toHaveLength(transactionSeeds.length);
      expect(result.total).toBe(transactionSeeds.length);

      result.items.forEach((transaction) => {
        const seed = transactionSeeds.find(
          (candidate) => candidate.description === transaction.description,
        );

        expect(seed).toBeDefined();

        if (!seed) {
          return;
        }

        expectTransactionToMatchSeed(transaction, seed);
      });
    });

    it('should sort and paginate transactions while preserving the total count', async () => {
      await Promise.all([
        createTransaction({
          description: 'Oldest',
          operations: [
            {
              account: usdAccount,
              amount: '100',
              description: 'Oldest operation',
            },
          ],
          postingDate: '2023-03-01' as IsoDateString,
          transactionDate: '2023-01-01' as IsoDateString,
        }),
        createTransaction({
          description: 'Middle',
          operations: [
            {
              account: usdAccount,
              amount: '200',
              description: 'Middle operation',
            },
          ],
          postingDate: '2023-01-01' as IsoDateString,
          transactionDate: '2023-02-01' as IsoDateString,
        }),
        createTransaction({
          description: 'Newest',
          operations: [
            {
              account: usdAccount,
              amount: '300',
              description: 'Newest operation',
            },
          ],
          postingDate: '2023-02-01' as IsoDateString,
          transactionDate: '2023-03-01' as IsoDateString,
        }),
      ]);

      const result = await transactionQueryRepo.findAll(user.id, {
        ...DEFAULT_TRANSACTION_QUERY,
        page: 2,
        pageSize: 1,
        sortBy: 'transactionDate',
        sortOrder: 'desc',
      });

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].description).toBe('Middle');
    });

    it('should sort transactions by posting date in ascending order', async () => {
      await Promise.all([
        createTransaction({
          description: 'Posted last',
          operations: [
            {
              account: usdAccount,
              amount: '100',
              description: 'Posted last operation',
            },
          ],
          postingDate: '2023-03-01' as IsoDateString,
        }),
        createTransaction({
          description: 'Posted first',
          operations: [
            {
              account: usdAccount,
              amount: '200',
              description: 'Posted first operation',
            },
          ],
          postingDate: '2023-01-01' as IsoDateString,
        }),
      ]);

      const result = await transactionQueryRepo.findAll(user.id, {
        ...DEFAULT_TRANSACTION_QUERY,
        sortBy: 'postingDate',
        sortOrder: 'asc',
      });

      expect(
        result.items.map((transaction) => transaction.description),
      ).toEqual(['Posted first', 'Posted last']);
    });

    it('should filter by account and return all active transaction operations', async () => {
      await Promise.all([
        createTransaction({
          description: 'Mixed accounts',
          operations: [
            {
              account: usdAccount,
              amount: '-100',
              description: 'USD operation',
            },
            {
              account: eurAccount,
              amount: '100',
              description: 'EUR operation',
            },
          ],
        }),
        createTransaction({
          description: 'EUR only',
          operations: [
            {
              account: eurAccount,
              amount: '200',
              description: 'EUR only operation',
            },
          ],
        }),
      ]);

      const result = await transactionQueryRepo.findAll(user.id, {
        ...DEFAULT_TRANSACTION_QUERY,
        accountId: usdAccount.id,
      });

      expect(result.total).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.items[0].description).toBe('Mixed accounts');
      expect(result.items[0].operations).toHaveLength(2);
    });

    it('should filter by an inclusive transaction date range', async () => {
      await Promise.all([
        createTransaction({
          description: 'Before range',
          operations: [
            {
              account: usdAccount,
              amount: '100',
              description: 'Before range operation',
            },
          ],
          transactionDate: '2023-01-01' as IsoDateString,
        }),
        createTransaction({
          description: 'Range start',
          operations: [
            {
              account: usdAccount,
              amount: '200',
              description: 'Range start operation',
            },
          ],
          transactionDate: '2023-01-02' as IsoDateString,
        }),
        createTransaction({
          description: 'Range end',
          operations: [
            {
              account: usdAccount,
              amount: '300',
              description: 'Range end operation',
            },
          ],
          transactionDate: '2023-01-03' as IsoDateString,
        }),
      ]);

      const result = await transactionQueryRepo.findAll(user.id, {
        ...DEFAULT_TRANSACTION_QUERY,
        dateFrom: '2023-01-02' as IsoDateString,
        dateTo: '2023-01-03' as IsoDateString,
      });

      expect(result.total).toBe(2);
      expect(
        result.items.map((transaction) => transaction.description),
      ).toEqual(['Range end', 'Range start']);
    });

    it('should filter transactions if they are deleted', async () => {
      const deletedTransactionSeeds: TransactionSeed[] = [
        {
          description: 'Salary',
          isTombstone: true,
          operations: [
            {
              account: usdAccount,
              amount: '-2000',
              description: 'Salary debit',
              isTombstone: true,
            },
            {
              account: usdAccount,
              amount: '2000',
              description: 'Salary credit',
              isTombstone: true,
            },
          ],
        },
      ];

      const transactionSeeds: TransactionSeed[] = [
        ...deletedTransactionSeeds,
        {
          description: 'Groceries',
          operations: [
            {
              account: usdAccount,
              amount: '-150',
              description: 'Groceries expense',
            },
            {
              account: eurAccount,
              amount: '150',
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
              amount: '-500',
              description: 'Transfer out',
            },
            {
              account: eurAccount,
              amount: '500',
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

      const result = await transactionQueryRepo.findAll(
        user.id,
        DEFAULT_TRANSACTION_QUERY,
      );

      expect(result.items).toHaveLength(
        transactionSeeds.length - deletedTransactionSeeds.length,
      );
      expect(result.total).toBe(
        transactionSeeds.length - deletedTransactionSeeds.length,
      );

      result.items.forEach((transaction) => {
        expect(transaction).not.toHaveProperty('isTombstone');
      });
    });

    it('should return application read model shape without persistence-only fields', async () => {
      await createTransaction({
        description: 'Read model contract',
        operations: [
          {
            account: usdAccount,
            amount: '-100',
            description: 'Contract debit',
          },
          {
            account: eurAccount,
            amount: '100',
            description: 'Contract credit',
          },
        ],
      });

      const result = await transactionQueryRepo.findAll(
        user.id,
        DEFAULT_TRANSACTION_QUERY,
      );

      expect(result.items).toHaveLength(1);

      const transaction = result.items[0];

      expect(Object.keys(transaction).sort()).toEqual(
        [
          'createdAt',
          'currency',
          'description',
          'id',
          'operations',
          'postingDate',
          'transactionDate',
          'updatedAt',
          'userId',
          'version',
        ].sort(),
      );
      expect(transaction).not.toHaveProperty('isTombstone');

      transaction.operations.forEach((operation) => {
        expect(Object.keys(operation).sort()).toEqual(
          [
            'accountId',
            'amount',
            'createdAt',
            'description',
            'id',
            'isSystem',
            'transactionId',
            'updatedAt',
            'userId',
            'value',
          ].sort(),
        );
        expect(operation).not.toHaveProperty('isTombstone');
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
            amount: '-1000',
            description: 'Exchange USD out',
          },
          {
            account: eurAccount,
            amount: '920',
            description: 'Exchange EUR in',
            value: '920',
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
            amount: '-300',
            description: 'Private transfer out',
          },
          {
            account: usdAccount,
            amount: '300',
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

    it('should return null when transaction is soft deleted', async () => {
      const transactionSeed: TransactionSeed = {
        description: 'Soft deleted transaction',
        operations: [
          {
            account: usdAccount,
            amount: '-300',
            description: 'Soft deleted transaction out',
          },
          {
            account: usdAccount,
            amount: '300',
            description: 'Soft deleted transaction in',
          },
        ],
      };

      const insertedTransaction = await createTransaction(transactionSeed);
      await testDB.softDeleteTransaction(insertedTransaction.id);

      const transaction = await transactionQueryRepo.findById(
        user.id,
        insertedTransaction.id,
      );

      expect(transaction).toBeNull();
    });

    it('should return transaction without soft deleted operations', async () => {
      const softDeletedOperations: TransactionSeed['operations'] = [
        {
          account: usdAccount,
          amount: '-500',
          description: 'Soft deleted operation out',
          isTombstone: true,
        },
        {
          account: usdAccount,
          amount: '500',
          description: 'Soft deleted operation in',
          isTombstone: true,
        },
      ];

      const activeOperations: TransactionSeed['operations'] = [
        {
          account: usdAccount,
          amount: '-300',
          description: 'Active operation out',
        },
        {
          account: usdAccount,
          amount: '300',
          description: 'Active operation in',
        },
      ];

      const operations = [...softDeletedOperations, ...activeOperations];

      const transactionSeed: TransactionSeed = {
        description: 'Transaction with soft deleted operation',
        operations,
      };

      const insertedTransaction = await createTransaction(transactionSeed);

      const transaction = await transactionQueryRepo.findById(
        user.id,
        insertedTransaction.id,
      );

      expect(transaction).not.toBeNull();

      expect(transaction?.operations).toHaveLength(activeOperations.length);
      expect(transaction?.operations.map((op) => op.description)).toEqual(
        activeOperations.map((op) => op.description),
      );

      transaction?.operations.forEach((op) => {
        expect(op).not.toHaveProperty('isTombstone');
      });
    });
  });
});
