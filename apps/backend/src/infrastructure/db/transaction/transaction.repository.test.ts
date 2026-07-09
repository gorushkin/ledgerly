import { UUID } from '@ledgerly/shared/types';
import {
  AccountMapper,
  OperationMapper,
  UserMapper,
} from 'src/application/mappers';
import { OperationDbRow, UserDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import {
  compareEntities,
  TransactionBuilder,
  TransactionPersistenceBuilderResult,
} from 'src/db/test-utils';
import { Account } from 'src/domain';
import { Amount, DateValue, Id, Version } from 'src/domain/domain-core';
import { OperationSnapshot } from 'src/domain/operations/types';
import {
  ForeignKeyConstraintError,
  RepositoryNotFoundError,
} from 'src/infrastructure/errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  OperationRepository,
  TransactionManager,
  TransactionRepository,
} from '../';

describe('TransactionRepository', () => {
  let testDB: TestDB;
  let transactionRepository: TransactionRepository;
  let user: UserDbRow;
  let usdAccount: Account;
  let eurAccount: Account;
  let data: TransactionPersistenceBuilderResult;
  const description = 'Test transaction';

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
    vi.clearAllMocks();

    testDB = new TestDB();

    await testDB.setupTestDb();

    user = await testDB.createUser();

    data = TransactionBuilder.persistence({
      accounts: ['USD', 'EUR'],
      operations: [
        {
          accountKey: 'USD',
          amount: '-200',
          description: 'Credit operation 1',
        },
        {
          accountKey: 'USD',
          amount: '200',
          description: 'Debit operation 1',
        },
        {
          accountKey: 'USD',
          amount: '-100',
          description: 'Credit operation 2',
        },
        {
          accountKey: 'USD',
          amount: '100',
          description: 'Debit operation 2',
        },
      ],
      settings: { description },
      user: UserMapper.toDomain(user),
    });

    usdAccount = data.getAccountByKey('USD');
    eurAccount = data.getAccountByKey('EUR');

    const usdSystemAccount = data.getSystemAccountByCurrency('USD');
    const eurSystemAccount = data.getSystemAccountByCurrency('EUR');

    await testDB.insertAccount(AccountMapper.toDBRow(usdAccount));
    await testDB.insertAccount(AccountMapper.toDBRow(eurAccount));
    await testDB.insertAccount(AccountMapper.toDBRow(usdSystemAccount));
    await testDB.insertAccount(AccountMapper.toDBRow(eurSystemAccount));

    transactionRepository = new TransactionRepository(
      mockOperationsRepository as unknown as OperationRepository,
      transactionManager as unknown as TransactionManager,
    );
  });

  describe('getById', () => {
    it('should retrieve a transaction by ID with operations', async () => {
      const transaction = data.transaction;

      const operationsDataToInsert = transaction
        .getOperations()
        .map((operation) => {
          return {
            accountId: operation.accountRelation.getParentId().valueOf(),
            amount: operation.amount.valueOf(),
            description: operation.description,
            id: operation.getId().valueOf(),
            isSystem: operation.isSystem,
            transactionId: operation.transactionId.valueOf(),
            value: operation.value.valueOf(),
          };
        });

      const insertedTransaction = await testDB.createTransactionWithOperations(
        user.id,
        {
          currencyCode: transaction.currency.valueOf(),
          description: transaction.description,
          operations: operationsDataToInsert,
          postingDate: transaction.getPostingDate().valueOf(),
          transactionDate: transaction.getTransactionDate().valueOf(),
        },
      );

      const retrievedTransaction = await transactionRepository.getById(
        user.id,
        insertedTransaction.id,
      );

      expect(retrievedTransaction).not.toBeNull();
      expect(retrievedTransaction?.description).toBe(transaction.description);

      expect(retrievedTransaction?.getPostingDate().valueOf()).toBe(
        transaction.getPostingDate().valueOf(),
      );
      expect(retrievedTransaction?.getTransactionDate().valueOf()).toBe(
        transaction.getTransactionDate().valueOf(),
      );

      const retrievedOperations = retrievedTransaction?.getOperations() ?? [];

      expect(retrievedOperations.length).toBe(operationsDataToInsert.length);

      retrievedOperations.forEach((operation) => {
        const matchingOperation = insertedTransaction.operations.find(
          (op) => op.id === operation.getId().valueOf(),
        );

        expect(matchingOperation).not.toBeUndefined();
        expect(operation.description).toBe(matchingOperation?.description);
        expect(operation.amount.valueOf()).toBe(
          matchingOperation?.amount.valueOf(),
        );
        expect(operation.isSystem).toBe(matchingOperation?.isSystem);
        expect(operation.value.valueOf()).toBe(
          matchingOperation?.value.valueOf(),
        );
      });
    });

    it('should restore all known operations and expose only active operations through getOperations', async () => {
      const transaction = data.transaction;

      const allOperationsCount = transaction.getAllOperations().length;

      const acc = transaction
        .getOperations()
        .reduce((acc, operation, index) => {
          if (index % 2 === 0) {
            operation.markAsDeleted();
            acc++;
          }
          return acc;
        }, 0);

      await testDB.insertTransaction({
        ...transaction.toSnapshot(),
      });

      const retrievedTransaction = await transactionRepository.getById(
        user.id,
        transaction.getId().valueOf(),
      );

      expect(retrievedTransaction).not.toBeNull();

      const retrievedOperations = retrievedTransaction?.getOperations() ?? [];

      expect(retrievedTransaction?.getAllOperations()).toHaveLength(
        allOperationsCount,
      );

      expect(retrievedOperations).toHaveLength(allOperationsCount - acc);

      retrievedOperations.forEach((operation) => {
        expect(operation.isDeleted()).toBe(false);
      });
    });

    it('should return null when transaction does not exist', async () => {
      const retrievedTransaction = await transactionRepository.getById(
        user.id,
        Id.create().valueOf(),
      );

      expect(retrievedTransaction).toBeNull();
    });

    it('should return null when transaction belongs to another user', async () => {
      const transaction = data.transaction;

      await testDB.insertTransaction({
        ...transaction.toSnapshot(),
      });

      const anotherUser = await testDB.createUser();

      const retrievedTransaction = await transactionRepository.getById(
        anotherUser.id,
        transaction.getId().valueOf(),
      );

      expect(retrievedTransaction).toBeNull();
    });

    it('should not retrieve a tombstone transaction', async () => {
      const transaction = data.transaction;

      await testDB.insertTransaction({
        ...transaction.toSnapshot(),
        isTombstone: true,
      });

      const retrievedTransaction = await transactionRepository.getById(
        user.id,
        transaction.getId().valueOf(),
      );

      expect(retrievedTransaction).toBeNull();
    });
  });

  describe('create', () => {
    it('should not create a transaction when user does not exist', async () => {
      const transaction = data.transaction;

      const nonExistentUserId = Id.create().valueOf();

      await expect(
        transactionRepository.create(nonExistentUserId, transaction),
      ).rejects.toThrow(ForeignKeyConstraintError);
    });

    it('should create a new transaction', async () => {
      const transaction = data.transaction;

      await transactionRepository.create(user.id, transaction);

      const createdTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(createdTransaction).not.toBeNull();

      expect(createdTransaction?.description).toBe(transaction.description);

      expect(createdTransaction?.postingDate).toBe(
        transaction.getPostingDate().valueOf(),
      );

      expect(createdTransaction?.transactionDate).toBe(
        transaction.getTransactionDate().valueOf(),
      );

      const expectedOperations = transaction
        .getAllOperations()
        .map((op) => OperationMapper.toDBRow(op));

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        expectedOperations,
      );
    });
  });

  describe('save', () => {
    it('should update transaction metadata and trigger save', async () => {
      const transaction = data.transaction;

      const operations = transaction.getOperations();

      const newOperationDescription = 'New operation description';
      const updateOperationDescription = 'Updated operation description';

      const operationsToCreate = [
        {
          account: usdAccount,
          amount: Amount.create('30000'),
          description: newOperationDescription,
          value: Amount.create('30000'),
        },
        {
          account: usdAccount,
          amount: Amount.create('-30000'),
          description: newOperationDescription,
          value: Amount.create('-30000'),
        },
      ];

      const operationsToUpdate = [
        {
          account: usdAccount,
          amount: Amount.create('-300'),
          description: updateOperationDescription,
          id: operations[0].getId(),
          value: Amount.create('-300'),
        },
        {
          account: usdAccount,
          amount: Amount.create('300'),
          description: updateOperationDescription,
          id: operations[1].getId(),
          value: Amount.create('300'),
        },
      ];

      const operationsToDelete = [operations[2].getId(), operations[3].getId()];

      const metadata = {
        description: 'Updated description',
        postingDate: DateValue.create().valueOf(),
        transactionDate: DateValue.create().valueOf(),
      };

      await testDB.insertTransaction(transaction.toSnapshot());
      const expectedVersion = transaction.getVersion();

      transaction.applyUpdate({
        metadata,
        operations: {
          create: operationsToCreate,
          delete: operationsToDelete,
          update: operationsToUpdate,
        },
      });

      const updatedSnapshot = transaction.toSnapshot();

      const isUpdated = await transactionRepository.update(
        user.id,
        transaction,
        expectedVersion,
      );

      const updatedTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(updatedTransaction).not.toBeNull();
      expect(isUpdated).toEqual({ ok: true });
      expect(updatedTransaction?.version).toBe(
        expectedVersion.increment().valueOf(),
      );

      expect(updatedTransaction?.description).toBe(updatedSnapshot.description);

      expect(updatedTransaction?.postingDate).toBe(updatedSnapshot.postingDate);

      expect(updatedTransaction?.transactionDate).toBe(
        updatedSnapshot.transactionDate,
      );

      const expectedOperationsSnapshots = new Map<UUID, OperationSnapshot>();

      data.transactionWithRelations?.operations.forEach((operationSnapshot) => {
        expectedOperationsSnapshots.set(
          operationSnapshot.id,
          operationSnapshot,
        );
      });

      const expectedOperations: OperationDbRow[] = [];

      transaction.getAllOperations().forEach((operation) => {
        expectedOperations.push(OperationMapper.toDBRow(operation));
      });

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        expectedOperations,
        expectedOperationsSnapshots,
      );
    });

    it('should not update transaction belonging to another user', async () => {
      const transaction = data.transaction;

      const transactionSnapshot = transaction.toSnapshot();

      const anotherUser = await testDB.createUser();

      await testDB.insertTransaction(transaction.toSnapshot());
      const expectedVersion = transaction.getVersion();

      transaction.applyUpdate({
        metadata: {
          description: 'Updated description',
          postingDate: transaction.getPostingDate().valueOf(),
          transactionDate: transaction.getTransactionDate().valueOf(),
        },
      });

      await expect(
        transactionRepository.update(
          anotherUser.id,
          transaction,
          expectedVersion,
        ),
      ).resolves.toEqual({ ok: false, reason: 'NOT_FOUND' });

      const retrievedTransaction = await transactionRepository.getById(
        data.transaction.getUserId().valueOf(),
        transaction.getId().valueOf(),
      );

      expect(retrievedTransaction).not.toBeNull();
      compareEntities(transactionSnapshot, retrievedTransaction!.toSnapshot());
    });

    it('should reject a stale version without saving transaction operations', async () => {
      const transactionSnapshot = {
        ...data.transaction.toSnapshot(),
        version: 1,
      };

      await testDB.insertTransaction(transactionSnapshot);

      const transaction = await transactionRepository.getById(
        user.id,
        transactionSnapshot.id,
      );

      expect(transaction).not.toBeNull();

      if (!transaction) {
        throw new Error('Expected transaction to be restored');
      }

      transaction.applyUpdate({
        metadata: {
          description: 'Stale update',
          postingDate: transaction.getPostingDate().valueOf(),
          transactionDate: transaction.getTransactionDate().valueOf(),
        },
      });

      const isUpdated = await transactionRepository.update(
        user.id,
        transaction,
        Version.create(0),
      );

      const persistedTransaction = await testDB.getTransactionWithRelations(
        transactionSnapshot.id,
      );

      expect(isUpdated).toEqual({
        ok: false,
        reason: 'VERSION_CONFLICT',
      });

      expect(persistedTransaction?.description).toBe(
        transactionSnapshot.description,
      );

      expect(persistedTransaction?.version).toBe(transactionSnapshot.version);
      expect(mockOperationsRepository.save).not.toHaveBeenCalled();
    });

    it('should report a tombstone transaction as not found', async () => {
      const transaction = data.transaction;
      const expectedVersion = transaction.getVersion();

      await testDB.insertTransaction(transaction.toSnapshot());
      await testDB.softDeleteTransaction(transaction.getId().valueOf());

      transaction.applyUpdate({
        metadata: {
          description: 'Update deleted transaction',
          postingDate: transaction.getPostingDate().valueOf(),
          transactionDate: transaction.getTransactionDate().valueOf(),
        },
      });

      const result = await transactionRepository.update(
        user.id,
        transaction,
        expectedVersion,
      );

      expect(result).toEqual({ ok: false, reason: 'NOT_FOUND' });
      expect(mockOperationsRepository.save).not.toHaveBeenCalled();
    });

    it('should not pass already tombstone operations to operation repository save', async () => {
      const transaction = data.transaction;
      const transactionSnapshot = transaction.toSnapshot();
      const [operationToDeleteOne, operationToDeleteTwo, ...activeOperations] =
        transactionSnapshot.operations;
      const operationsToDelete = [operationToDeleteOne, operationToDeleteTwo];

      await testDB.insertTransaction({
        ...transactionSnapshot,
        operations: [
          ...operationsToDelete.map((operation) => ({
            ...operation,
            isTombstone: true,
          })),
          ...activeOperations,
        ],
      });

      const restoredTransaction = await transactionRepository.getById(
        user.id,
        transaction.getId().valueOf(),
      );

      expect(restoredTransaction).not.toBeNull();

      if (!restoredTransaction) {
        throw new Error('Expected transaction to be restored');
      }

      const expectedVersion = restoredTransaction.getVersion();

      restoredTransaction.applyUpdate({
        metadata: {
          description: 'Updated description',
          postingDate: restoredTransaction.getPostingDate().valueOf(),
          transactionDate: restoredTransaction.getTransactionDate().valueOf(),
        },
      });

      await transactionRepository.update(
        user.id,
        restoredTransaction,
        expectedVersion,
      );

      const expectedOperationsSnapshots = new Map<UUID, OperationSnapshot>();

      const persistedTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      persistedTransaction?.operations.forEach((operationSnapshot) => {
        expectedOperationsSnapshots.set(
          operationSnapshot.id,
          operationSnapshot,
        );
      });

      const expectedOperations = restoredTransaction
        .getAllOperations()
        .filter((operation) => !operation.isDeleted())
        .map((operation) => OperationMapper.toDBRow(operation));

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        expectedOperations,
        expectedOperationsSnapshots,
      );
    });

    it('should not update isTombstone field when saving', async () => {
      const transaction = data.transaction;

      const isDeleted = transaction.isDeleted();

      await testDB.insertTransaction(transaction.toSnapshot());
      const expectedVersion = transaction.getVersion();
      transaction.markAsDeleted();

      await transactionRepository.update(user.id, transaction, expectedVersion);

      const updatedTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(updatedTransaction).not.toBeNull();
      expect(updatedTransaction?.isTombstone).toBe(isDeleted);
    });
  });

  describe('softDelete', () => {
    it('should not soft delete a transaction belonging to another user', async () => {
      const transaction = data.transaction;

      const anotherUser = await testDB.createUser();

      await testDB.insertTransaction(transaction.toSnapshot());

      await expect(
        transactionRepository.softDelete(anotherUser.id, transaction),
      ).rejects.toThrow(RepositoryNotFoundError);

      const retrievedTransaction = await transactionRepository.getById(
        data.transaction.getUserId().valueOf(),
        transaction.getId().valueOf(),
      );

      expect(retrievedTransaction).not.toBeNull();

      if (!retrievedTransaction) {
        throw new Error('Expected transaction to be retrieved');
      }

      compareEntities(
        transaction.toSnapshot(),
        retrievedTransaction.toSnapshot(),
      );
    });

    it('should soft delete the transaction and its operations', async () => {
      const transaction = data.transaction;

      await testDB.insertTransaction(transaction.toSnapshot());

      transaction.markAsDeleted();

      await transactionRepository.softDelete(user.id, transaction);

      const deletedTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(deletedTransaction).not.toBeNull();
      expect(deletedTransaction?.isTombstone).toBe(true);

      expect(transaction.description).toBe(deletedTransaction?.description);

      expect(transaction.getPostingDate().valueOf()).toBe(
        deletedTransaction?.postingDate,
      );

      expect(transaction.getTransactionDate().valueOf()).toBe(
        deletedTransaction?.transactionDate,
      );

      expect(deletedTransaction?.currency).toBe(transaction.currency.valueOf());

      const expectedOperations: OperationDbRow[] = [];

      transaction.getAllOperations().forEach((operation) => {
        expectedOperations.push(OperationMapper.toDBRow(operation));
      });

      const expectedOperationsSnapshots = new Map<UUID, OperationSnapshot>();

      data.transactionWithRelations?.operations.forEach((operationSnapshot) => {
        expectedOperationsSnapshots.set(
          operationSnapshot.id,
          operationSnapshot,
        );
      });

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        expectedOperations,
        expectedOperationsSnapshots,
      );
    });
  });
});
