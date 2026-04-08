import { UUID } from '@ledgerly/shared/types';
import { OperationMapper } from 'src/application/mappers/operation.mapper';
import { OperationDbRow, UserDbRow } from 'src/db/schema';
import { TestDB } from 'src/db/test-db';
import {
  TransactionBuilder,
  TransactionBuilderResult,
} from 'src/db/test-utils';
import { Account, Operation, User } from 'src/domain';
import { Amount, DateValue } from 'src/domain/domain-core';
import { OperationSnapshot } from 'src/domain/operations/types';
import { TransactionBuildContext } from 'src/domain/transactions/types';
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
  let transactionContext: TransactionBuildContext;
  let usdAccount: Account;
  let eurAccount: Account;
  let data: TransactionBuilderResult;
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
    testDB = new TestDB();

    await testDB.setupTestDb();

    user = await testDB.createUser();

    const transactionBuilder = TransactionBuilder.create(
      User.fromPersistence(user),
    );

    data = transactionBuilder
      .withAccounts(['USD', 'EUR'])
      .withOperations([
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
      ])
      .withDescription(description)
      .attachOperations()
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
      mockOperationsRepository as unknown as OperationRepository,
      transactionManager as unknown as TransactionManager,
    );

    transactionContext = data.transactionContext;
  });

  describe('getTransactionSnapshot', () => {
    it('should retrieve a transaction snapshot with operations', async () => {
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

      const snapshot = await transactionRepository.getTransactionSnapshot(
        user.id,
        insertedTransaction.id,
      );

      expect(snapshot).not.toBeNull();
      expect(snapshot?.description).toBe(transaction.description);

      expect(snapshot?.postingDate).toBe(
        transaction.getPostingDate().valueOf(),
      );
      expect(snapshot?.transactionDate).toBe(
        transaction.getTransactionDate().valueOf(),
      );

      const retrievedOperations = snapshot?.operations ?? [];

      expect(retrievedOperations.length).toBe(operationsDataToInsert.length);

      retrievedOperations.forEach((operation) => {
        const matchingOperation = insertedTransaction.operations.find(
          (op) => op.id === operation.id,
        );

        expect(matchingOperation).not.toBeUndefined();
        expect(operation.description).toBe(matchingOperation?.description);
        expect(operation.amount).toBe(matchingOperation?.amount);
        expect(operation.isSystem).toBe(matchingOperation?.isSystem);
        expect(operation.value).toBe(matchingOperation?.value);
      });
    });
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
  });

  describe('create', () => {
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

      const expectedSnapshots = transaction
        .getOperations()
        .map((op) => op.toSnapshot());

      expect(mockOperationsRepository.save).toHaveBeenCalledWith(
        user.id,
        expectedSnapshots,
      );
    });
  });

  describe('save', () => {
    it('should update transaction metadata and trigger save', async () => {
      const transaction = data.transaction;

      const initDeletedOperations: Operation[] = [];
      const initExistedOperations: Operation[] = [];

      transaction.getOperations().forEach((operation) => {
        if (operation.isDeleted()) {
          initDeletedOperations.push(operation);
        } else {
          initExistedOperations.push(operation);
        }
      });

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

      transaction.applyUpdate(
        {
          metadata,
          operations: {
            create: operationsToCreate,
            delete: operationsToDelete,
            update: operationsToUpdate,
          },
        },
        transactionContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      vi.spyOn(
        transactionRepository,
        'getTransactionSnapshot',
      ).mockResolvedValue(data.transactionWithRelations);

      await transactionRepository.update(user.id, transaction);

      const updatedTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(updatedTransaction).not.toBeNull();

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

      transaction.getOperations().forEach((operation) => {
        expectedOperations.push(OperationMapper.toDBRow(operation));
      });

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
      transaction.markAsDeleted();

      await transactionRepository.update(user.id, transaction);

      const updatedTransaction = await testDB.getTransactionWithRelations(
        transaction.getId().valueOf(),
      );

      expect(updatedTransaction).not.toBeNull();
      expect(updatedTransaction?.isTombstone).toBe(isDeleted);
    });
  });

  describe('softDelete', () => {
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

      transaction.getOperations().forEach((operation) => {
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
