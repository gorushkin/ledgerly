import { UUID } from '@ledgerly/shared/types';
import {
  CreateEntryRequestDTO,
  EntryMapper,
  OperationMapper,
} from 'src/application';
import { EntryDbInsert, UserDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import { TransactionBuilder } from 'src/db/test-utils';
import { Account, Entry, Operation, Transaction, User } from 'src/domain';
import { Amount, DateValue } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { EntrySnapshot } from 'src/domain/entries/types';
import { OperationSnapshot } from 'src/domain/operations/types';
import { TransactionBuildContext } from 'src/domain/transactions/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  let entry1: CreateEntryRequestDTO;
  let entry2: CreateEntryRequestDTO;
  let usdAccount: Account;
  let eurAccount: Account;

  const postingDate = DateValue.create().valueOf();
  const transactionDate = DateValue.create().valueOf();
  const description = 'Test transaction';

  const mockEntriesRepository = {
    save: vi.fn(),
  };

  const mockOperationsRepository = {
    save: vi.fn(),
  };

  const transactionManager = {
    getCurrentTransaction: () => testDB.db,
    run: vi.fn((cb: () => unknown) => {
      return cb();
    }),
  };

  beforeEach(async () => {
    testDB = new TestDB();

    await testDB.setupTestDb();

    user = await testDB.createUser();

    const transactionBuilder = TransactionBuilder.create(
      User.fromPersistence(user),
    );

    const data = transactionBuilder
      .withAccounts(['USD', 'EUR'])
      .withSystemAccounts()
      .build();

    usdAccount = data.getAccountByKey('USD');
    eurAccount = data.getAccountByKey('EUR');

    const usdSystemAccount = data.getSystemAccountByCurrency('USD');
    const eurSystemAccount = data.getSystemAccountByCurrency('EUR');

    await testDB.insertAccount(usdAccount.toPersistence());
    await testDB.insertAccount(eurAccount.toPersistence());
    await testDB.insertAccount(usdSystemAccount.toPersistence());
    await testDB.insertAccount(eurSystemAccount.toPersistence());

    transactionRepository = new TransactionRepository(
      mockEntriesRepository as unknown as EntryRepository,
      mockOperationsRepository as unknown as OperationRepository,
      transactionManager as unknown as TransactionManager,
    );

    entryContext = data.entryContext;

    entry1 = {
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
    };

    entry2 = {
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
    };
  });

  describe('create', () => {
    it('should create a transaction and trigger entriesRepository.save and operationsRepository.save', async () => {
      const userDomain = User.fromPersistence(user);

      const transaction = Transaction.create(
        userDomain.getId(),
        {
          description,
          entries: [entry1, entry2],
          postingDate,
          transactionDate,
        },
        entryContext,
      );

      const entriesInsert: EntryDbInsert[] = transaction
        .getEntries()
        .map((entry) => {
          return EntryMapper.toDBRow(entry);
        });

      const operationsToInsert = transaction
        .getEntries()
        .flatMap((entry) =>
          entry
            .getOperations()
            .map((operation) => OperationMapper.toDBRow(operation)),
        );

      await transactionRepository.rootSave(user.id, transaction);

      const row = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(mockEntriesRepository.save).toHaveBeenCalledTimes(1);

      expect(mockEntriesRepository.save).toHaveBeenCalledWith(
        user.id,
        entriesInsert,
        new Map<UUID, EntrySnapshot>(),
      );

      expect(mockOperationsRepository.save).toHaveBeenCalledTimes(1);
      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        operationsToInsert,
        new Map<UUID, OperationSnapshot>(),
      );

      expect(row).not.toBeNull();
      expect(row?.description).toBe(description);
      expect(row?.postingDate).toBe(postingDate);
      expect(row?.transactionDate).toBe(transactionDate);
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
    });

    it('should return null if transaction not found', async () => {
      const fetchedTransaction = await transactionRepository.getById(
        user.id,
        Id.create().valueOf(),
      );

      expect(fetchedTransaction).toBeNull();
    });
  });

  describe('Update transaction', () => {
    let transactionId: UUID;

    let restoredTransaction: Transaction;

    let addedEntries: Entry[];
    let addedOperations: Operation[];

    let entriesSnapshots: Map<UUID, EntrySnapshot>;
    let operationsSnapshots: Map<UUID, OperationSnapshot>;

    beforeEach(async () => {
      const userDomain = User.fromPersistence(user);

      const transaction = Transaction.create(
        userDomain.getId(),
        {
          description,
          entries: [entry1],
          postingDate,
          transactionDate,
        },
        entryContext,
      );

      const snapshot = transaction.toSnapshot();

      entriesSnapshots = new Map<UUID, EntrySnapshot>();
      operationsSnapshots = new Map<UUID, OperationSnapshot>();

      snapshot?.entries.forEach((entrySnapshot) => {
        entriesSnapshots.set(entrySnapshot.id, entrySnapshot);

        entrySnapshot.operations.forEach((operationSnapshot) => {
          operationsSnapshots.set(operationSnapshot.id, operationSnapshot);
        });
      });

      addedEntries = transaction.getEntries();

      addedOperations = transaction
        .getEntries()
        .flatMap((entry) => entry.getOperations());

      const transactionDBRow = await testDB.insertTransaction(
        transaction.toSnapshot(),
      );

      transactionId = transactionDBRow.id;

      const transactionWithRelations =
        await testDB.getTransactionWithRelations(transactionId);

      if (!transactionWithRelations) {
        throw new Error('Failed to retrieve transaction with relations');
      }

      restoredTransaction = Transaction.restore({
        createdAt: transactionWithRelations.createdAt,
        description: transactionWithRelations.description,
        entries: transactionWithRelations.entries,
        id: transactionWithRelations.id,
        isTombstone: transactionWithRelations.isTombstone,
        postingDate: transactionWithRelations.postingDate,
        transactionDate: transactionWithRelations.transactionDate,
        updatedAt: transactionWithRelations.updatedAt,
        userId: transactionWithRelations.userId,
        version: transactionWithRelations.version,
      });
    });

    it('should update transaction description and dates and trigger entriesRepository.save and operationsRepository.save with empty arrays', async () => {
      const transactionDBRowBeforeUpdate =
        await testDB.getTransactionWithRelations(transactionId);

      expect(transactionDBRowBeforeUpdate).not.toBeNull();
      expect(transactionDBRowBeforeUpdate?.description).toBe(description);

      restoredTransaction.applyUpdate({
        entries: {
          create: [],
          delete: [],
          update: [],
        },
        metadata: {
          description: 'Updated Description',
          postingDate: DateValue.restore('2024-01-01').valueOf(),
          transactionDate: DateValue.restore('2024-01-02').valueOf(),
        },
      });

      await transactionRepository.rootSave(user.id, restoredTransaction);

      const transactionDBRowAfterUpdate =
        await testDB.getTransactionWithRelations(transactionId);

      expect(transactionDBRowAfterUpdate).not.toBeNull();
      expect(transactionDBRowAfterUpdate?.description).toBe(
        'Updated Description',
      );
      expect(transactionDBRowAfterUpdate?.postingDate).toBe(
        DateValue.restore('2024-01-01').valueOf(),
      );
      expect(transactionDBRowAfterUpdate?.transactionDate).toBe(
        DateValue.restore('2024-01-02').valueOf(),
      );

      expect(mockEntriesRepository.save).toHaveBeenCalledWith(
        user.id,
        [],
        new Map<UUID, EntrySnapshot>(),
      );

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        [],
        new Map<UUID, OperationSnapshot>(),
      );
    });

    it('Should trigger entriesRepository.save and operationsRepository.save with deletions', async () => {
      await Promise.all(
        addedEntries.map(async (entry) => {
          const entrySnapshot = entry.toSnapshot();
          await testDB.insertEntry(entrySnapshot);

          await Promise.all(
            entry.getOperations().map(async (operation) => {
              const operationSnapshot = operation.toSnapshot();
              await testDB.insertOperation(operationSnapshot);
            }),
          );
        }),
      );

      const entriesToDeleteId = addedEntries.map((entry) =>
        entry.getId().valueOf(),
      );

      restoredTransaction.attachEntries(addedEntries);

      restoredTransaction.applyUpdate(
        {
          entries: {
            create: [],
            delete: entriesToDeleteId,
            update: [],
          },
          metadata: {},
        },
        entryContext,
      );

      await transactionRepository.rootSave(user.id, restoredTransaction);

      expect(mockEntriesRepository.save).toHaveBeenCalledWith(
        user.id,
        addedEntries.map((entry) => EntryMapper.toDBRow(entry)),
        entriesSnapshots,
      );

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        addedOperations.map((operation) => OperationMapper.toDBRow(operation)),
        operationsSnapshots,
      );
    });
  });
});
