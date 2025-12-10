import { ROUTES } from '@ledgerly/shared/routes';
import { UUID } from '@ledgerly/shared/types';
import { TransactionCreateInput } from '@ledgerly/shared/validation';
import { TransactionResponseDTO } from 'src/application';
import {
  EntryDbRow,
  OperationDbRow,
  TransactionDbRow,
  UserDbRow,
} from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { Amount, Currency, DateValue, Id } from 'src/domain/domain-core';
import { createServer } from 'src/presentation/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'Password123!',
};

const url = `/api${ROUTES.transactions}`;

describe('Transactions Integration Tests', () => {
  let testDB: TestDB;
  let server: ReturnType<typeof createServer>;
  let authToken: string;
  let userId: UUID;
  let user: UserDbRow;

  beforeEach(async () => {
    testDB = new TestDB();
    server = createServer(testDB.db);
    await testDB.setupTestDb();

    await server.ready();

    user = await testDB.createUser(testUser);

    const token = server.jwt.sign({
      email: user.email,
      userId: user.id,
    });

    authToken = token;

    const decoded = server.jwt.decode(token) as unknown as { userId: UUID };
    userId = Id.fromPersistence(decoded.userId).valueOf();
  });

  afterEach(async () => {
    await testDB.cleanupTestDb();
  });

  describe('POST /api/transactions', () => {
    it('should create a new transaction', async () => {
      const account1 = await testDB.createAccount(userId, {
        name: 'Checking',
      });

      const account2 = await testDB.createAccount(userId, {
        name: 'Savings',
      });

      const fromOperation = {
        accountId: account1.id,
        amount: Amount.create('-100').valueOf(),
        description: 'Transfer from checking',
      };

      const toOperation = {
        accountId: account2.id,
        amount: Amount.create('100').valueOf(),
        description: 'Transfer to savings',
      };

      const payload: TransactionCreateInput = {
        description: 'some transaction',
        entries: [
          {
            description: 'Transfer between accounts',
            operations: [fromOperation, toOperation],
          },
        ],
        postingDate: DateValue.restore('2025-11-07').valueOf(),
        transactionDate: DateValue.restore('2025-11-07').valueOf(),
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      const transaction = JSON.parse(response.body) as TransactionResponseDTO;

      expect(response.statusCode).toBe(201);
      expect(transaction.description).toBe(payload.description);
      expect(transaction.postingDate).toBe(payload.postingDate);
      expect(transaction.transactionDate).toBe(payload.transactionDate);
      expect(transaction.userId).toBe(userId);
      expect(transaction.entries.length).toBe(payload.entries.length);
      transaction.entries.forEach((entry) => {
        expect(entry.userId).toBe(userId);
        expect(entry.operations.length).toBe(2);
      });
    });

    it('should fail when required fields are missing', async () => {
      const payload = {
        // missing description, entries, postingDate, transactionDate
        description: 'incomplete transaction',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail with invalid amounts', async () => {
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });
      const account2 = await testDB.createAccount(userId, { name: 'Savings' });

      const payload = {
        description: 'invalid amount',
        entries: [
          [
            {
              accountId: account1.id,
              amount: 'not-a-number',
              description: 'Invalid amount',
            },
            {
              accountId: account2.id,
              amount: '100',
              description: 'Valid amount',
            },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should fail for unauthorized access', async () => {
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });
      const account2 = await testDB.createAccount(userId, { name: 'Savings' });

      const payload = {
        description: 'unauthorized',
        entries: [
          [
            {
              accountId: account1.id,
              amount: '-100',
              description: 'Transfer from checking',
            },
            {
              accountId: account2.id,
              amount: '100',
              description: 'Transfer to savings',
            },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
      };

      const response = await server.inject({
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(401);
    });

    it.skip('should fail for non-existent accounts', async () => {
      const payload = {
        description: 'non-existent account',
        entries: [
          [
            { accountId: 'non-existent-id', amount: '-100' },
            { accountId: 'another-non-existent-id', amount: '100' },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(404);
    });

    it.skip('should fail for zero amounts', async () => {
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });
      const account2 = await testDB.createAccount(userId, { name: 'Savings' });

      const payload = {
        description: 'zero amount',
        entries: [
          [
            { accountId: account1.id, amount: '0' },
            { accountId: account2.id, amount: '0' },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });

    it.skip('should fail when from and to accounts are the same', async () => {
      const account1 = await testDB.createAccount(userId, { name: 'Checking' });

      const payload = {
        description: 'same accounts',
        entries: [
          [
            { accountId: account1.id, amount: '-100' },
            { accountId: account1.id, amount: '100' },
          ],
        ],
        postingDate: '2025-11-07',
        transactionDate: '2025-11-07',
      };

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'POST',
        payload,
        url,
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/transactions/:id', () => {
    let singleCurrencyTransaction: TransactionDbRow;
    let multiCurrencyTransaction: TransactionDbRow;
    let singleCurrencyEntries: EntryDbRow[];
    let multiCurrencyEntry: EntryDbRow;
    const entryOperationsMap: Record<UUID, OperationDbRow[]> = {};

    const singleCurrencyEntry1operationData = [
      {
        amount: Amount.create('-100').valueOf(),
        description: 'Transfer from checking',
        isSystem: false,
      },
      {
        amount: Amount.create('100').valueOf(),
        description: 'Transfer to savings',
        isSystem: false,
      },
    ];

    const singleCurrencyEntry2operationData = [
      {
        amount: Amount.create('50').valueOf(),
        description: 'Deposit to checking',
        isSystem: false,
      },
      {
        amount: Amount.create('-50').valueOf(),
        description: 'Withdrawal from savings',
        isSystem: false,
      },
    ];

    beforeEach(async () => {
      const accounts = await Promise.all([
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          name: 'Checking USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          name: 'Savings USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('EUR').valueOf(),
          name: 'Savings EUR',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('EUR').valueOf(),
          isSystem: true,
          name: 'System account USD',
        }),
        testDB.createAccount(userId, {
          currency: Currency.create('USD').valueOf(),
          isSystem: true,
          name: 'System account EUR',
        }),
      ]);

      singleCurrencyTransaction = await testDB.createTransaction(userId);
      multiCurrencyTransaction = await testDB.createTransaction(userId);

      singleCurrencyEntries = await Promise.all([
        testDB.createEntry(userId, {
          transactionId: singleCurrencyTransaction.id,
        }),
        testDB.createEntry(userId, {
          transactionId: singleCurrencyTransaction.id,
        }),
      ]);

      multiCurrencyEntry = await testDB.createEntry(userId, {
        transactionId: multiCurrencyTransaction.id,
      });

      const singleCurrencyEntry1ops = await Promise.all(
        singleCurrencyEntry1operationData.map((opData) => {
          return testDB.createOperation(userId, {
            accountId: opData.amount.startsWith('-')
              ? accounts[0].id
              : accounts[1].id,
            entryId: singleCurrencyEntries[0].id,
            ...opData,
          });
        }),
      );

      const singleCurrencyEntry2ops = await Promise.all(
        singleCurrencyEntry2operationData.map((opData) => {
          return testDB.createOperation(userId, {
            accountId: opData.amount.startsWith('-')
              ? accounts[1].id
              : accounts[0].id,
            entryId: singleCurrencyEntries[1].id,
            ...opData,
          });
        }),
      );

      const multiCurrencyEntryOperationData = [
        {
          accountId: accounts[0].id,
          amount: Amount.create('50').valueOf(),
          description: 'Deposit to checking',
          isSystem: false,
        },
        {
          accountId: accounts[1].id,
          amount: Amount.create('-100').valueOf(),
          description: 'Withdrawal from savings',
          isSystem: false,
        },
        {
          accountId: accounts[3].id,
          amount: Amount.create('100').valueOf(),
          description: 'Deposit to checking',
          isSystem: true,
        },
        {
          accountId: accounts[4].id,
          amount: Amount.create('-50').valueOf(),
          description: 'Withdrawal from savings',
          isSystem: true,
        },
      ];

      await Promise.all(
        multiCurrencyEntryOperationData.map((opData) => {
          return testDB.createOperation(userId, {
            entryId: multiCurrencyEntry.id,
            ...opData,
          });
        }),
      );

      entryOperationsMap[singleCurrencyEntries[0].id] = singleCurrencyEntry1ops;
      entryOperationsMap[singleCurrencyEntries[1].id] = singleCurrencyEntry2ops;
    });

    it('should retrieve a transaction by ID', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${singleCurrencyTransaction.id}`,
      });

      const transactionResponse = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      expect(response.statusCode).toBe(200);
      expect(transactionResponse.id).toBe(singleCurrencyTransaction.id);
      expect(transactionResponse.userId).toBe(userId);
      expect(transactionResponse.entries.length).toBe(
        singleCurrencyEntries.length,
      );

      transactionResponse.entries.forEach((entry) => {
        expect(entry.userId).toBe(userId);
        const originalEntry = singleCurrencyEntries.find(
          (e) => e.id === entry.id,
        );
        expect(originalEntry).toBeDefined();
        expect(entry.operations.length).toBe(2);
        expect(entry.transactionId).toBe(singleCurrencyTransaction.id);
        expect(entry.id).toBe(originalEntry?.id);
        expect(entry.createdAt).toBe(originalEntry?.createdAt);
        expect(entry.updatedAt).toBe(originalEntry?.updatedAt);

        entry.operations.forEach((op, index) => {
          const originalOp = entryOperationsMap[entry.id][index];

          expect(op.id).toBe(originalOp.id);
          expect(op.userId).toBe(userId);
          expect(op.entryId).toBe(entry.id);
          expect(op.amount).toBe(originalOp.amount);
          expect(op.description).toBe(originalOp.description);
          expect(op.createdAt).toBe(originalOp.createdAt);
          expect(op.updatedAt).toBe(originalOp.updatedAt);
        });
      });
    });

    it('should retrieve system operations as well', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}/${multiCurrencyTransaction.id}`,
      });

      const transactionResponse = JSON.parse(
        response.body,
      ) as TransactionResponseDTO;

      transactionResponse.entries.forEach((entry) => {
        expect(entry.userId).toBe(userId);
        expect(entry.transactionId).toBe(multiCurrencyTransaction.id);
      });

      expect(transactionResponse.entries.length).toBe(1);
      const entry = transactionResponse.entries[0];
      expect(entry.operations.length).toBe(4);

      const operations = entry.operations;

      const userOperations = operations.filter((op) => !op.isSystem);
      const systemOperations = operations.filter((op) => op.isSystem);

      expect(userOperations).toHaveLength(2);
      expect(systemOperations).toHaveLength(2);
    });
  });

  describe('GET /api/transactions', () => {
    it('should retrieve all transactions for the user', async () => {
      await testDB.seedTestData(user);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const transactions = JSON.parse(
        response.body,
      ) as TransactionResponseDTO[];

      const userTransactions = transactions.filter(
        (tx) => tx.userId === userId,
      );

      expect(userTransactions).toHaveLength(2);
    });

    it('should return empty array if user has no transactions', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url,
      });

      expect(response.statusCode).toBe(200);

      const transactions = JSON.parse(
        response.body,
      ) as TransactionResponseDTO[];

      const userTransactions = transactions.filter(
        (tx) => tx.userId === userId,
      );

      expect(userTransactions).toHaveLength(0);
    });

    it('should return filtered transactions based on query params', async () => {
      const { account3 } = await testDB.seedTestData(user);

      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?accountId=${account3.id}`,
      });

      expect(response.statusCode).toBe(200);

      const transactions = JSON.parse(
        response.body,
      ) as TransactionResponseDTO[];

      expect(transactions).toHaveLength(1);
    });

    it('should throw 400 for invalid query params', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?accountId=12`,
      });

      expect(response.statusCode).toBe(400);
    });

    it('should ignore unknown query parameters and return 200', async () => {
      const response = await server.inject({
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        method: 'GET',
        url: `${url}?someRandomParam=someValue`,
      });

      expect(response.statusCode).toBe(200);

      const transactions = JSON.parse(
        response.body,
      ) as TransactionResponseDTO[];

      expect(transactions).toHaveLength(0);
    });
  });

  // describe('PUT /api/transactions/:id', () => {
  //   it('should update an existing transaction and all related entries and operations', async () => {
  //     const accounts = await Promise.all([
  //       testDB.createAccount(userId, {
  //         currency: Currency.create('USD').valueOf(),
  //         name: 'Account 1 USD',
  //       }),
  //       testDB.createAccount(userId, {
  //         currency: Currency.create('EUR').valueOf(),
  //         name: 'Account 2 EUR',
  //       }),
  //       testDB.createAccount(userId, {
  //         currency: Currency.create('USD').valueOf(),
  //         name: 'Account 3 USD',
  //       }),
  //       testDB.createAccount(userId, {
  //         currency: Currency.create('EUR').valueOf(),
  //         name: 'Account 4 EUR',
  //       }),
  //     ]);

  //     const transaction = await testDB.createTransaction(userId, {
  //       description: 'Initial description',
  //       postingDate: DateValue.restore('2025-11-01').valueOf(),
  //       transactionDate: DateValue.restore('2025-11-01').valueOf(),
  //     });

  //     const entries = await Promise.all([
  //       testDB.createEntry(userId, {
  //         transactionId: transaction.id,
  //       }),
  //       testDB.createEntry(userId, {
  //         transactionId: transaction.id,
  //       }),
  //     ]);

  //     const operations = await Promise.all([
  //       testDB.createOperation(userId, {
  //         accountId: accounts[0].id,
  //         amount: Amount.create('-10000').valueOf(),
  //         description: 'Initial operation 1 USD',
  //         entryId: entries[0].id,
  //         isSystem: false,
  //       }),
  //       testDB.createOperation(userId, {
  //         accountId: accounts[1].id,
  //         amount: Amount.create('10000').valueOf(),
  //         description: 'Initial operation 2 EUR',
  //         entryId: entries[0].id,
  //         isSystem: false,
  //       }),
  //       testDB.createOperation(userId, {
  //         accountId: accounts[2].id,
  //         amount: Amount.create('5000').valueOf(),
  //         description: 'Initial operation 3 USD',
  //         entryId: entries[1].id,
  //         isSystem: false,
  //       }),
  //       testDB.createOperation(userId, {
  //         accountId: accounts[3].id,
  //         amount: Amount.create('-5000').valueOf(),
  //         description: 'Initial operation 4 EUR',
  //         entryId: entries[1].id,
  //         isSystem: false,
  //       }),
  //     ]);

  //     const payload: TransactionUpdateInput = {
  //       description: 'Updated description',
  //       entries: [
  //         {
  //           description: 'Updated Entry 1',
  //           operations: [
  //             {
  //               accountId: Id.fromPersistence(accounts[0].id).valueOf(),
  //               amount: Amount.create('-70000').valueOf(),
  //               description: 'Updated operation 1',
  //             },
  //             {
  //               accountId: Id.fromPersistence(accounts[1].id).valueOf(),
  //               amount: Amount.create('10000').valueOf(),
  //               description: 'Updated operation 2',
  //             },
  //           ],
  //         },
  //       ],
  //       postingDate: DateValue.restore('2025-11-10').valueOf(),
  //       transactionDate: DateValue.restore('2025-11-10').valueOf(),
  //     };

  //     const response = await server.inject({
  //       headers: {
  //         Authorization: `Bearer ${authToken}`,
  //       },
  //       method: 'PUT',
  //       payload,
  //       url: `${url}/${transaction.id}`,
  //     });

  //     const updatedTransaction = JSON.parse(
  //       response.body,
  //     ) as TransactionResponseDTO;

  //     expect(response.statusCode).toBe(200);
  //     expect(updatedTransaction.description).toBe(payload.description);
  //     expect(updatedTransaction.postingDate).toBe(payload.postingDate);
  //     expect(updatedTransaction.transactionDate).toBe(payload.transactionDate);

  //     await Promise.all(
  //       operations.map((op) =>
  //         testDB.getOperationById(op.id).then((fetchedOp) => {
  //           expect(fetchedOp).toBeNull();
  //         }),
  //       ),
  //     );

  //     expect(updatedTransaction.entries.length).toBe(payload.entries.length);

  //     updatedTransaction.entries.forEach((entry, index) => {
  //       expect(entry.operations.length).toBe(
  //         payload.entries[index].operations.length,
  //       );

  //       entry.operations.forEach((op, opIndex) => {
  //         const payloadOp = payload.entries[index].operations[opIndex];
  //         expect(op.accountId).toBe(payloadOp.accountId);
  //         expect(op.amount).toBe(payloadOp.amount);
  //         expect(op.description).toBe(payloadOp.description);
  //       });
  //     });
  //   });

  //   it('should return 404 when updating non-existent transaction', async () => {
  //     const payload = {
  //       description: 'Updated description',
  //       entries: [],
  //       postingDate: '2025-11-10',
  //       transactionDate: '2025-11-10',
  //     };

  //     const response = await server.inject({
  //       headers: {
  //         Authorization: `Bearer ${authToken}`,
  //       },
  //       method: 'PUT',
  //       payload,
  //       url: `${url}/${Id.create().valueOf()}`,
  //     });

  //     expect(response.statusCode).toBe(404);
  //   });

  //   it('should return 400 for invalid update payload', async () => {
  //     const transaction = await testDB.createTransaction(userId, {
  //       description: 'Initial description',
  //       postingDate: DateValue.restore('2025-11-01').valueOf(),
  //       transactionDate: DateValue.restore('2025-11-01').valueOf(),
  //     });

  //     const payload = {
  //       // missing required fields
  //       description: '',
  //     };

  //     const response = await server.inject({
  //       headers: {
  //         Authorization: `Bearer ${authToken}`,
  //       },
  //       method: 'PUT',
  //       payload,
  //       url: `${url}/${transaction.id}`,
  //     });

  //     expect(response.statusCode).toBe(400);
  //   });
  // });
});
