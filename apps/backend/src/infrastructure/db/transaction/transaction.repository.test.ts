import { CurrencyCode, UUID } from '@ledgerly/shared/types';
import { CreateEntryRequestDTO } from 'src/application';
import { UserDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { Account, Transaction, User } from 'src/domain';
import { Amount, DateValue } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { TransactionBuildContext } from 'src/domain/transactions/types';
import { beforeEach, describe, expect, it } from 'vitest';

import {
  OperationRepository,
  EntryRepository,
  TransactionManager,
  TransactionRepository,
} from '../';

describe('TransactionRepository', () => {
  let testDB: TestDB;
  let transactionRepository: TransactionRepository;
  let user: UserDbRow;
  let entryContext: TransactionBuildContext;
  let entries: CreateEntryRequestDTO[];

  beforeEach(async () => {
    testDB = new TestDB();

    const transactionManager = new TransactionManager(testDB.db);

    await testDB.setupTestDb();

    user = await testDB.createUser();

    const usdAccountDB = await testDB.createAccount(user.id, {
      currency: 'USD' as unknown as CurrencyCode,
      name: 'User USD Account',
    });

    const eurAccountDB = await testDB.createAccount(user.id, {
      currency: 'EUR' as unknown as CurrencyCode,
      name: 'User EUR Account',
    });

    const usdSystemAccountDB = await testDB.createAccount(user.id, {
      currency: 'USD' as unknown as CurrencyCode,
      isSystem: true,
      name: 'System USD Account',
    });

    const eurSystemAccountDB = await testDB.createAccount(user.id, {
      currency: 'EUR' as unknown as CurrencyCode,
      isSystem: true,
      name: 'System EUR Account',
    });

    const usdAccount = Account.restore(usdAccountDB);
    const eurAccount = Account.restore(eurAccountDB);
    const usdSystemAccount = Account.restore(usdSystemAccountDB);
    const eurSystemAccount = Account.restore(eurSystemAccountDB);

    const operationRepository = new OperationRepository(transactionManager);

    const entryRepository = new EntryRepository(transactionManager);

    transactionRepository = new TransactionRepository(
      entryRepository,
      operationRepository,
      transactionManager,
    );

    entryContext = {
      accountsMap: new Map<UUID, Account>([
        [usdAccount.getId().valueOf(), usdAccount],
        [eurAccount.getId().valueOf(), eurAccount],
      ]),
      systemAccountsMap: new Map<CurrencyCode, Account>([
        [usdSystemAccount.getCurrency().valueOf(), usdSystemAccount],
        [eurSystemAccount.getCurrency().valueOf(), eurSystemAccount],
      ]),
    };

    entries = [
      {
        description: 'Sample Entry 1',
        operations: [
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('-200').valueOf(),
            description: 'Credit operation 1',
          },
          {
            accountId: eurAccount.getId().valueOf(),
            amount: Amount.create('100').valueOf(),
            description: 'Debit operation 2',
          },
        ],
      },
      {
        description: 'Sample Entry 2',
        operations: [
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('-200').valueOf(),
            description: 'Credit operation 3',
          },
          {
            accountId: usdAccount.getId().valueOf(),
            amount: Amount.create('200').valueOf(),
            description: 'Debit operation 4',
          },
        ],
      },
    ];
  });

  describe('create', () => {
    it('should create a transaction successfully with 4 operations per entry', async () => {
      const postingDate = DateValue.create().valueOf();
      const transactionDate = DateValue.create().valueOf();
      const description = 'Test transaction';

      const userDomain = User.fromPersistence(user);

      const transaction = Transaction.create(
        userDomain,
        {
          description,
          entries,
          postingDate,
          transactionDate,
        },
        entryContext,
      );

      await transactionRepository.save(user.id, transaction);

      const row = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      const operationsCount = [4, 2];

      expect(row).not.toBeNull();
      expect(row?.description).toBe(description);
      expect(row?.postingDate).toBe(postingDate);
      expect(row?.transactionDate).toBe(transactionDate);
      expect(row?.entries.length).toBe(entries.length);

      entries.forEach((entryDTO, index) => {
        const matchedEntry = row!.entries[index];
        expect(matchedEntry.description).toBe(entryDTO.description);
        expect(matchedEntry.operations.length).toBe(operationsCount[index]);

        entryDTO.operations.forEach((opDTO, opIndex) => {
          const matchedOperation = matchedEntry.operations[opIndex];
          expect(matchedOperation.description).toBe(opDTO.description);
          expect(matchedOperation.amount).toBe(opDTO.amount);
          expect(matchedOperation.accountId).toBe(opDTO.accountId);
        });
      });
    });
  });

  describe('getById', () => {
    it('should retrieve a transaction by ID', async () => {
      const transaction = await testDB.createTransaction(user.id);

      const fetchedTransaction = await transactionRepository.getById(
        user.id,
        transaction.id,
      );

      expect(fetchedTransaction?.description).toEqual(transaction.description);
      expect(fetchedTransaction?.getPostingDate().valueOf()).toEqual(
        transaction.postingDate,
      );
      expect(fetchedTransaction?.getTransactionDate().valueOf()).toEqual(
        transaction.transactionDate,
      );

      expect(fetchedTransaction?.getEntries().length).toBe(0);

      fetchedTransaction?.getEntries().forEach((entry) => {
        expect(entry.getTransactionId()).toBe(transaction.id);
        expect(entry.getOperations().length).toBe(0);
      });
    });

    it('should return null if transaction not found', async () => {
      const fetchedTransaction = await transactionRepository.getById(
        user.id,
        Id.create().valueOf(),
      );

      expect(fetchedTransaction).toBeNull();
    });
  });

  // describe.skip('getAll', () => {
  //   let account1: AccountDbRow;
  //   let account2: AccountDbRow;
  //   let account3: AccountDbRow;

  //   let transaction1: TransactionDbInsert;
  //   let transaction2: TransactionDbInsert;

  //   let entry1Transaction1: EntryDbRow;
  //   let entry2Transaction1: EntryDbRow;
  //   let entry1Transaction2: EntryDbRow;

  //   beforeEach(async () => {
  //     account1 = await testDB.createAccount(user.id, { name: 'Account 1' });
  //     account2 = await testDB.createAccount(user.id, { name: 'Account 2' });
  //     account3 = await testDB.createAccount(user.id, { name: 'Account 3' });
  //     await testDB.createAccount(user.id, { name: 'Account 4' });

  //     transaction1 = await testDB.createTransaction(user.id);
  //     transaction2 = await testDB.createTransaction(user.id);
  //     await testDB.createTransaction(user.id);

  //     entry1Transaction1 = await testDB.createEntry(user.id, {
  //       transactionId: transaction1.id,
  //     });

  //     entry2Transaction1 = await testDB.createEntry(user.id, {
  //       transactionId: transaction1.id,
  //     });

  //     entry1Transaction2 = await testDB.createEntry(user.id, {
  //       transactionId: transaction2.id,
  //     });

  //     await testDB.createOperation(user.id, {
  //       accountId: account1.id,
  //       amount: Amount.create('100').valueOf(),
  //       description: 'Test Operation 1',
  //       entryId: entry1Transaction1.id,
  //     });

  //     await testDB.createOperation(user.id, {
  //       accountId: account2.id,
  //       amount: Amount.create('-100').valueOf(),
  //       description: 'Test Operation 2',
  //       entryId: entry1Transaction1.id,
  //     });

  //     await testDB.createOperation(user.id, {
  //       accountId: account3.id,
  //       amount: Amount.create('50').valueOf(),
  //       description: 'Test Operation 3',
  //       entryId: entry2Transaction1.id,
  //     });

  //     await testDB.createOperation(user.id, {
  //       accountId: account1.id,
  //       amount: Amount.create('-50').valueOf(),
  //       description: 'Test Operation 4',
  //       entryId: entry2Transaction1.id,
  //     });

  //     await testDB.createOperation(user.id, {
  //       accountId: account1.id,
  //       amount: Amount.create('200').valueOf(),
  //       description: 'Test Operation 5',
  //       entryId: entry1Transaction2.id,
  //     });

  //     await testDB.createOperation(user.id, {
  //       accountId: account2.id,
  //       amount: Amount.create('-200').valueOf(),
  //       description: 'Test Operation 6',
  //       entryId: entry1Transaction2.id,
  //     });
  //   });

  //   it('should retrieve transactions by account ID', async () => {
  //     const operationsByAccount1 = await testDB.getOperationsByAccountId(
  //       user.id,
  //       account1.id,
  //     );

  //     const transactions = await transactionRepository.getAll(user.id, {
  //       accountId: account1.id,
  //     });

  //     const ids = transactions.flatMap((tx) =>
  //       tx.entries.flatMap((entry) => entry.operations.map((op) => op.id)),
  //     );

  //     operationsByAccount1.forEach((op) => {
  //       expect(ids).toContain(op.id);

  //       const matchingOp = transactions
  //         .flatMap((tx) => tx.entries)
  //         .flatMap((entry) => entry.operations)
  //         .find((operation) => operation.id === op.id);

  //       expect(matchingOp).toBeDefined();
  //       expect(matchingOp).toEqual(op);
  //     });

  //     expect(transactions.length).toBe(2);
  //   });

  //   it('should return empty array if no transactions found for account ID', async () => {
  //     const transactions = await transactionRepository.getAll(user.id, {
  //       accountId: Id.create().valueOf(),
  //     });

  //     expect(transactions).toEqual([]);
  //   });

  //   it('should not return transactions for other users', async () => {
  //     const otherUser = await testDB.createUser();

  //     const account = await testDB.createAccount(otherUser.id, {
  //       name: 'Other User Account',
  //     });

  //     const transactions = await transactionRepository.getAll(user.id, {
  //       accountId: account.id,
  //     });

  //     expect(transactions).toEqual([]);
  //   });
  // });

  // describe.skip('update', () => {
  //   it('should update only the description if only description is provided', async () => {
  //     const transaction = await testDB.createTransaction(user.id, {
  //       description: 'Initial Description',
  //       postingDate: DateValue.restore('2023-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2023-01-02').valueOf(),
  //     });

  //     const updatedData = {
  //       description: 'Updated Only Description',
  //     };

  //     const updatedTransaction = await transactionRepository.update(
  //       user.id,
  //       transaction.id,
  //       updatedData,
  //     );

  //     expect(updatedTransaction.description).toBe(updatedData.description);
  //     expect(updatedTransaction.postingDate).toBe(transaction.postingDate);
  //     expect(updatedTransaction.transactionDate).toBe(
  //       transaction.transactionDate,
  //     );
  //   });

  //   it('should update a transaction successfully', async () => {
  //     const transaction = await testDB.createTransaction(user.id, {
  //       description: 'Old Description',
  //       postingDate: DateValue.restore('2023-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2023-01-02').valueOf(),
  //     });

  //     const updatedData = {
  //       description: 'New Description',
  //       postingDate: DateValue.restore('2024-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2024-01-02').valueOf(),
  //     };

  //     const updatedTransaction = await transactionRepository.update(
  //       user.id,
  //       transaction.id,
  //       updatedData,
  //     );

  //     expect(updatedTransaction.description).toBe(updatedData.description);
  //     expect(updatedTransaction.postingDate).toBe(updatedData.postingDate);
  //     expect(updatedTransaction.transactionDate).toBe(
  //       updatedData.transactionDate,
  //     );
  //   });

  //   it('should throw an error when updating a non-existent transaction', async () => {
  //     const updatedData = {
  //       description: 'Non-existent',
  //       postingDate: DateValue.restore('2024-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2024-01-02').valueOf(),
  //     };

  //     await expect(
  //       transactionRepository.update(
  //         user.id,
  //         Id.create().valueOf(),
  //         updatedData,
  //       ),
  //     ).rejects.toThrowError(RepositoryNotFoundError);
  //   });

  //   it('should not update a transaction belonging to another user', async () => {
  //     const otherUser = await testDB.createUser();

  //     const transaction = await testDB.createTransaction(otherUser.id, {
  //       description: 'Other User Transaction',
  //       postingDate: DateValue.restore('2023-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2023-01-02').valueOf(),
  //     });

  //     const updatedData = {
  //       description: 'Updated Description',
  //       postingDate: DateValue.restore('2024-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2024-01-02').valueOf(),
  //     };

  //     await expect(
  //       transactionRepository.update(user.id, transaction.id, updatedData),
  //     ).rejects.toThrowError(RepositoryNotFoundError);
  //   });

  //   it('should only update allowed fields', async () => {
  //     const transaction = await testDB.createTransaction(user.id, {
  //       description: 'Initial Description',
  //       postingDate: DateValue.restore('2023-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2023-01-02').valueOf(),
  //     });

  //     const updatedData = {
  //       description: 'Changed Description',
  //       id: Id.create().valueOf(), // This field should not be updated
  //       isTombstone: true, // This field should not be updated
  //       postingDate: DateValue.restore('2024-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2024-01-02').valueOf(),
  //       userId: Id.create().valueOf(), // This field should not be updated
  //     };

  //     const updatedTransaction = await transactionRepository.update(
  //       user.id,
  //       transaction.id,
  //       updatedData,
  //     );

  //     expect(updatedTransaction.description).toBe(updatedData.description);
  //     expect(updatedTransaction.postingDate).toBe(updatedData.postingDate);
  //     expect(updatedTransaction.transactionDate).toBe(
  //       updatedData.transactionDate,
  //     );
  //     expect(updatedTransaction.isTombstone).toBe(false);
  //     expect(updatedTransaction.id).toBe(transaction.id);
  //     expect(updatedTransaction.userId).toBe(transaction.userId);
  //     expect(updatedTransaction.createdAt).toBe(transaction.createdAt);
  //   });

  //   it('should not allow updating isTombstone from true to false or vice versa', async () => {
  //     const transaction = await testDB.createTransaction(user.id, {
  //       description: 'Tombstone Transaction',
  //       postingDate: DateValue.restore('2023-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2023-01-02').valueOf(),
  //     });

  //     await testDB.softDeleteTransaction(transaction.id);

  //     const updatedData = {
  //       description: 'Attempted Change',
  //       isTombstone: false, // Should not be updated
  //       postingDate: DateValue.restore('2024-01-01').valueOf(),
  //       transactionDate: DateValue.restore('2024-01-02').valueOf(),
  //     };

  //     const updatedTransaction = await transactionRepository.update(
  //       user.id,
  //       transaction.id,
  //       updatedData,
  //     );

  //     expect(updatedTransaction.isTombstone).toBe(true);
  //     expect(updatedTransaction.description).toBe(updatedData.description);
  //     expect(updatedTransaction.postingDate).toBe(updatedData.postingDate);
  //     expect(updatedTransaction.transactionDate).toBe(
  //       updatedData.transactionDate,
  //     );
  //   });
  // });
});
