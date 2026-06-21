import { TransactionMapper } from 'src/application';
import { UpdateOperationRequestDTO } from 'src/application/dto';
import { createUser } from 'src/db/createTestUser';
import {
  compareEntities,
  TransactionBuilder,
  TransactionBuilderResult,
} from 'src/db/test-utils';
import { TransactionProps } from 'src/db/test-utils/testEntityBuilder';
import {
  ConflictingOperationIdsError,
  DeletedEntityOperationError,
  ExcessiveOperationsError,
  InsufficientOperationsError,
  OperationNotFoundInTransactionError,
  UnbalancedTransactionError,
} from 'src/domain/domain.errors';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Amount, DateValue, Id, Version } from '../domain-core';
import {
  CreateOperationProps,
  OperationSnapshot,
  UpdateOperationProps,
} from '../operations/types';
import { User } from '../users/user.entity';

import { MAX_TRANSACTION_OPERATIONS } from './constants';
import { Transaction } from './transaction.entity';
import { CreateTransactionProps } from './types';

const areOperationsEqual = (
  ops1: OperationSnapshot[],
  ops2: OperationSnapshot[],
) => {
  if (ops1.length !== ops2.length) {
    return false;
  }

  for (let i = 0; i < ops1.length; i++) {
    const op1 = ops1[i];
    const op2 = ops2[i];

    compareEntities(op1, op2);
  }
};

describe('Transaction Domain Entity', () => {
  let user: User;

  let data: TransactionBuilderResult;

  let transactionData: CreateTransactionProps;

  const transactionRawData: TransactionProps = {
    currencyCode: 'USD',
    description: 'Buy groceries',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
  };

  const operationsData1 = {
    accountKey: 'USD',
    amount: '10000',
    description: 'groceries Account',
  };

  const operationsData2 = {
    accountKey: 'USD',
    amount: '-10000',
    description: 'USD Wallet adjustment',
  };

  const operationsData3 = {
    accountKey: 'USD',
    amount: '50000',
    description: 'fuel Account',
  };

  const operationsData4 = {
    accountKey: 'USD',
    amount: '-50000',
    description: 'USD phone bill Account',
  };

  const operationsData = [
    operationsData1,
    operationsData2,
    operationsData3,
    operationsData4,
  ];

  const createBalancedOperations = (count: number): CreateOperationProps[] => {
    const account = data.getAccountByKey('USD');
    const operationPairs = Array.from({ length: Math.floor(count / 2) }, () => [
      {
        account,
        amount: Amount.create('1'),
        description: 'Debit operation',
        value: Amount.create('1'),
      },
      {
        account,
        amount: Amount.create('-1'),
        description: 'Credit operation',
        value: Amount.create('-1'),
      },
    ]).flat();

    return count % 2 === 0
      ? operationPairs
      : [
          ...operationPairs,
          {
            account,
            amount: Amount.create('0'),
            description: 'Zero operation',
            value: Amount.create('0'),
          },
        ];
  };

  beforeAll(async () => {
    user = await createUser();

    data = TransactionBuilder.transaction({
      accounts: ['USD', 'EUR', 'RUB', 'TRY'],
      operations: operationsData,
      settings: transactionRawData,
      user,
    });

    transactionData = TransactionMapper.toCreateTransactionProps(
      data.transactionDTO,
      data.transactionContext,
    );
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Creation and Restoration', () => {
    it('should create a valid transaction with operation', () => {
      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      const transaction = Transaction.create(user.getId(), transactionData);

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.description).toBe(transactionData.description);
      expect(transaction.getPostingDate()).toEqual(transactionData.postingDate);
      expect(transaction.getTransactionDate()).toEqual(
        transactionData.transactionDate,
      );
      expect(transaction.getId()).toBeDefined();
      expect(transaction.getCreatedAt()).toBeDefined();
      expect(transaction.getUpdatedAt()).toBeDefined();
      expect(transaction.getVersion().valueOf()).toBe(0);
      expect(transaction.isDeleted()).toBe(false);

      expect(transaction.currency).toBe(transactionData.currency);

      const transactionOperations = transaction.getOperations();

      expect(transactionOperations).toHaveLength(operationsData.length);

      transactionOperations.forEach((op, index) => {
        const matchedOpData = operationsData[index];
        expect(op.amount.valueOf()).toBe(matchedOpData.amount);
        expect(op.description).toBe(matchedOpData.description);
      });
    });

    it('should serialize and deserialize correctly', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const transactionSnapshot = transaction.toSnapshot();

      expect(transactionSnapshot).toMatchObject({
        description: transactionRawData.description,
        postingDate: transactionRawData.postingDate,
        transactionDate: transactionRawData.transactionDate,
        userId: user.getId().valueOf(),
      });

      const restoredTransaction = Transaction.restore(transactionSnapshot);
      expect(restoredTransaction.toSnapshot()).toEqual(transactionSnapshot);
    });

    it('should restore the persisted version as a value object', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const transactionSnapshot = transaction.toSnapshot();

      const restoredTransaction = Transaction.restore({
        ...transactionSnapshot,
        version: 7,
      });

      expect(restoredTransaction.getVersion().valueOf()).toBe(7);
      expect(restoredTransaction.matchesVersion(Version.create(7))).toBe(true);
      expect(restoredTransaction.matchesVersion(Version.create(6))).toBe(false);
      expect(restoredTransaction.toSnapshot().version).toBe(7);
    });

    it('should restore tombstone operations without allowing them to be updated', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const transactionSnapshot = transaction.toSnapshot();
      const [operationToDelete1, operationToDelete2, ...activeOperations] =
        transactionSnapshot.operations;

      const restoredTransaction = Transaction.restore({
        ...transactionSnapshot,
        operations: [
          {
            ...operationToDelete1,
            isTombstone: true,
          },
          {
            ...operationToDelete2,
            isTombstone: true,
          },
          ...activeOperations,
        ],
      });

      expect(restoredTransaction.getAllOperations()).toHaveLength(
        transactionSnapshot.operations.length,
      );
      expect(restoredTransaction.getOperations()).toHaveLength(
        activeOperations.length,
      );

      const operationAccount = data.accountsMap.get(
        operationToDelete1.accountId,
      );

      if (!operationAccount) {
        throw new Error('Test setup failed: Account not found');
      }

      expect(() =>
        restoredTransaction.applyUpdate({
          operations: {
            create: [],
            delete: [],
            update: [
              {
                account: operationAccount,
                amount: Amount.create('15000'),
                description: 'Updated tombstone operation',
                id: Id.fromPersistence(operationToDelete1.id),
                value: Amount.create('15000'),
              },
            ],
          },
        }),
      ).toThrow(OperationNotFoundInTransactionError);
    });
  });

  describe('Updating Transaction data', () => {
    it('Should update only description, increment version and update timestamps', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const description = 'Updated transaction description';
      const originalSnapshot = transaction.toSnapshot();
      const originalVersion = transaction.getVersion();

      vi.advanceTimersByTime(5000);

      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      transaction.applyUpdate({ metadata: { ...metadata, description } });

      const updatedSnapshot = transaction.toSnapshot();

      expect(transaction.getVersion()).not.toBe(originalVersion);
      expect(transaction.getVersion().valueOf()).toBe(
        originalVersion.valueOf() + 1,
      );
      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.description).toBe(description);
      expect(originalSnapshot.postingDate).toBe(updatedSnapshot.postingDate);
      expect(originalSnapshot.transactionDate).toBe(
        updatedSnapshot.transactionDate,
      );

      areOperationsEqual(
        originalSnapshot.operations,
        updatedSnapshot.operations,
      );
    });

    it('Should update only postingDate, increment version and update timestamps', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const postingDate = DateValue.restore('2024-02-15').valueOf();

      const originalSnapshot = transaction.toSnapshot();

      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate({ metadata: { ...metadata, postingDate } });

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.postingDate).toBe(postingDate);
      expect(originalSnapshot.description).toBe(updatedSnapshot.description);
      expect(originalSnapshot.transactionDate).toBe(
        updatedSnapshot.transactionDate,
      );

      areOperationsEqual(
        originalSnapshot.operations,
        updatedSnapshot.operations,
      );
    });

    it('Should update only transactionDate, increment version and update timestamps', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const transactionDate = DateValue.restore('2024-03-10').valueOf();

      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      transaction.applyUpdate({ metadata: { ...metadata, transactionDate } });
      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.transactionDate).toBe(transactionDate);
      expect(originalSnapshot.description).toBe(updatedSnapshot.description);
      expect(originalSnapshot.postingDate).toBe(updatedSnapshot.postingDate);

      areOperationsEqual(
        originalSnapshot.operations,
        updatedSnapshot.operations,
      );
    });

    it('Should update all fields at once, increment version and update timestamps', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();

      const description = 'Fully updated transaction';
      const postingDate = DateValue.restore('2024-04-01').valueOf();
      const transactionDate = DateValue.restore('2024-04-05').valueOf();

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate({
        metadata: { description, postingDate, transactionDate },
      });

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.description).toBe(description);
      expect(updatedSnapshot.postingDate).toBe(postingDate);
      expect(updatedSnapshot.transactionDate).toBe(transactionDate);
      expect(originalSnapshot.version + 1).toBe(updatedSnapshot.version);

      areOperationsEqual(
        originalSnapshot.operations,
        updatedSnapshot.operations,
      );
    });
  });

  describe('Manage Operations', () => {
    const toUpdateProps = (
      transaction: Transaction,
      operationIndex: number,
      id: Id,
    ): UpdateOperationProps => {
      const operation = transaction.getOperations()[operationIndex];
      const account = data.accountsMap.get(operation.getAccountId().valueOf());

      if (!account) {
        throw new Error('Test setup failed: Account not found');
      }

      return {
        account,
        amount: operation.amount,
        description: operation.description,
        id,
        value: operation.value,
      };
    };

    const captureConflictingOperationIdsError = (
      action: () => void,
    ): ConflictingOperationIdsError => {
      try {
        action();
      } catch (error) {
        expect(error).toBeInstanceOf(ConflictingOperationIdsError);
        return error as ConflictingOperationIdsError;
      }

      throw new Error('Expected ConflictingOperationIdsError to be thrown');
    };

    it('should reject the same operation ID in update and delete when represented by different Id instances', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const operationId = transaction.getOperations()[0].getId().valueOf();

      const error = captureConflictingOperationIdsError(() =>
        transaction.applyUpdate({
          operations: {
            create: [],
            delete: [Id.fromPersistence(operationId)],
            update: [
              toUpdateProps(transaction, 0, Id.fromPersistence(operationId)),
            ],
          },
        }),
      );

      expect(error.conflictingIds).toEqual([operationId]);
      expect(error.conflictType).toBe(
        'IDs found in both update and delete arrays',
      );
    });

    it('should reject duplicate update IDs represented by different Id instances', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const operationId = transaction.getOperations()[0].getId().valueOf();

      const error = captureConflictingOperationIdsError(() =>
        transaction.applyUpdate({
          operations: {
            create: [],
            delete: [],
            update: [
              toUpdateProps(transaction, 0, Id.fromPersistence(operationId)),
              toUpdateProps(transaction, 0, Id.fromPersistence(operationId)),
            ],
          },
        }),
      );

      expect(error.conflictingIds).toEqual([operationId]);
      expect(error.conflictType).toBe('Duplicate IDs in update array');
    });

    it('should reject duplicate delete IDs represented by different Id instances', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const operationId = transaction.getOperations()[0].getId().valueOf();

      const error = captureConflictingOperationIdsError(() =>
        transaction.applyUpdate({
          operations: {
            create: [],
            delete: [
              Id.fromPersistence(operationId),
              Id.fromPersistence(operationId),
            ],
            update: [],
          },
        }),
      );

      expect(error.conflictingIds).toEqual([operationId]);
      expect(error.conflictType).toBe('Duplicate IDs in delete array');
    });

    it('should reject updating a non-existent operation without changing the transaction', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const originalSnapshot = transaction.toSnapshot();
      const unknownOperationId = Id.create();

      expect(() =>
        transaction.applyUpdate({
          operations: {
            create: [],
            delete: [],
            update: [toUpdateProps(transaction, 0, unknownOperationId)],
          },
        }),
      ).toThrow(OperationNotFoundInTransactionError);

      expect(transaction.toSnapshot()).toEqual(originalSnapshot);
    });

    it('should reject deleting a non-existent operation without changing the transaction', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      const originalSnapshot = transaction.toSnapshot();
      const unknownOperationId = Id.create();

      expect(() =>
        transaction.applyUpdate({
          operations: {
            create: [],
            delete: [unknownOperationId],
            update: [],
          },
        }),
      ).toThrow(OperationNotFoundInTransactionError);

      expect(transaction.toSnapshot()).toEqual(originalSnapshot);
    });

    it('Should add a new operation and increase version', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();

      const prevOperations: UpdateOperationRequestDTO[] = transaction
        .getOperations()
        .map((op) => ({
          accountId: op.getAccountId().valueOf(),
          amount: op.amount.valueOf(),
          description: op.description,
          id: op.getId().valueOf(),
          value: op.value.valueOf(),
        }));

      const usdAccount = data.getAccountByKey('USD');
      const eurAccount = data.getAccountByKey('EUR');

      const newOperationData1: CreateOperationProps = {
        account: usdAccount,
        amount: Amount.create('5000'),
        description: 'New Operation',
        value: Amount.create('5000'),
      };

      const newOperationData2: CreateOperationProps = {
        account: eurAccount,
        amount: Amount.create('-5000'),
        description: 'New Operation',
        value: Amount.create('-5000'),
      };

      const operationsToAdd: CreateOperationProps[] = [
        newOperationData1,
        newOperationData2,
      ];

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate({
        operations: {
          create: operationsToAdd,
          delete: [],
          update: [],
        },
      });

      const updatedSnapshot = transaction.toSnapshot();

      expect(transaction.getOperations()).toHaveLength(
        prevOperations.length + operationsToAdd.length,
      );

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.version).toBe(originalSnapshot.version + 1);

      updatedSnapshot.operations.forEach((op) => {
        const matchedPrevOp = prevOperations.find(
          (prevOp) => op.id === prevOp.id,
        );

        if (matchedPrevOp) {
          expect(op.accountId).toBe(matchedPrevOp.accountId);
          expect(op.amount).toBe(matchedPrevOp.amount);
          expect(op.description).toBe(matchedPrevOp.description);
          expect(op.value).toBe(matchedPrevOp.value);
          return;
        }

        const matchedNewOp = operationsToAdd.find(
          (newOp) =>
            newOp.account.getId().valueOf() === op.accountId &&
            newOp.amount.valueOf() === op.amount &&
            newOp.description === op.description &&
            newOp.value.valueOf() === op.value,
        );

        expect(matchedNewOp).toBeDefined();
        expect(op.accountId).toBe(matchedNewOp?.account.getId().valueOf());
        expect(op.amount).toBe(matchedNewOp?.amount.valueOf());
        expect(op.description).toBe(matchedNewOp?.description);
        expect(op.value).toBe(matchedNewOp?.value.valueOf());
      });
    });

    it('should update existing operations and increase the aggregate version once', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();

      const prevOperations = transaction.getOperations();

      const [operationToUpdate1, operationToUpdate2] = prevOperations;

      const account1 = data.accountsMap.get(
        operationToUpdate1.getAccountId().valueOf(),
      );

      const account2 = data.accountsMap.get(
        operationToUpdate2.getAccountId().valueOf(),
      );

      if (!account1 || !account2) {
        throw new Error('Test setup failed: Account not found');
      }

      const updatedOperationData: UpdateOperationProps[] = [
        {
          account: account1,
          amount: Amount.create('20000'),
          description: 'Updated Operation',
          id: operationToUpdate1.id,
          value: Amount.create('20000'),
        },
        {
          account: account2,
          amount: Amount.create('-20000'),
          description: 'Updated Operation',
          id: operationToUpdate2.id,
          value: Amount.create('-20000'),
        },
      ];

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate({
        operations: {
          create: [],
          delete: [],
          update: updatedOperationData,
        },
      });

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(transaction.getOperations()).toHaveLength(prevOperations.length);

      expect(updatedSnapshot.version).toBe(originalSnapshot.version + 1);

      updatedOperationData.forEach((operationUpdate) => {
        const updatedOperation = updatedSnapshot.operations.find(
          (operation) => operation.id === operationUpdate.id.valueOf(),
        );

        expect(updatedOperation).toBeDefined();
        expect(updatedOperation?.accountId).toBe(
          operationUpdate.account.getId().valueOf(),
        );
        expect(updatedOperation?.amount).toBe(operationUpdate.amount.valueOf());
        expect(updatedOperation?.description).toBe(operationUpdate.description);
        expect(updatedOperation?.value).toBe(operationUpdate.value.valueOf());
      });

      originalSnapshot.operations
        .filter(
          (operation) =>
            !updatedOperationData.some(
              (operationUpdate) =>
                operationUpdate.id.valueOf() === operation.id,
            ),
        )
        .forEach((originalOperation) => {
          const unchangedOperation = updatedSnapshot.operations.find(
            (operation) => operation.id === originalOperation.id,
          );

          expect(unchangedOperation).toEqual(originalOperation);
        });
    });

    it('Should delete an existing operation, keep it in snapshot and hide it from active operations', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();

      const operationsToDelete = [
        transaction.getOperations()[0],
        transaction.getOperations()[1],
      ].map((op) => op.getId());

      const operationsToDeleteIds = operationsToDelete.map((op) =>
        op.valueOf(),
      );

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate({
        operations: {
          create: [],
          delete: operationsToDelete,
          update: [],
        },
      });

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(transaction.getOperations()).toHaveLength(
        originalSnapshot.operations.length - operationsToDeleteIds.length,
      );

      const deletedOperationSnapshot = updatedSnapshot.operations.filter((op) =>
        operationsToDeleteIds.includes(op.id),
      );

      expect(deletedOperationSnapshot).toHaveLength(
        operationsToDeleteIds.length,
      );
      deletedOperationSnapshot.forEach((op) => {
        expect(op.isTombstone).toBe(true);
      });

      originalSnapshot.operations.forEach((op) => {
        if (operationsToDeleteIds.includes(op.id)) {
          return;
        }

        expect(operationsToDeleteIds.includes(op.id)).toBe(false);

        const matchedPrevOp = updatedSnapshot.operations.find(
          (prevOp) => op.id === prevOp.id,
        );

        expect(matchedPrevOp).toBeDefined();
        compareEntities(matchedPrevOp!, op);
      });
    });
  });

  describe('Deletion', () => {
    it('should mark transaction as deleted and all related operations, increase version and update timestamps', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      transaction.markAsDeleted();

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.version).toBe(originalSnapshot.version + 1);

      expect(transaction.isDeleted()).toBe(true);

      const operations = transaction.getAllOperations();

      operations.forEach((operation) => {
        expect(operation.isDeleted()).toBe(true);
      });
    });

    it('should reject updates after transaction is deleted', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      transaction.markAsDeleted();

      const deletedSnapshot = transaction.toSnapshot();
      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      expect(() =>
        transaction.applyUpdate({
          metadata: {
            ...metadata,
            description: 'Updated deleted transaction',
          },
        }),
      ).toThrow(DeletedEntityOperationError);

      expect(transaction.toSnapshot()).toEqual(deletedSnapshot);
    });

    it('Should not increase version if transaction is already deleted', () => {
      const transaction = Transaction.create(user.getId(), transactionData);
      transaction.markAsDeleted();

      const originalSnapshot = transaction.toSnapshot();

      transaction.markAsDeleted();

      const updatedSnapshot = transaction.toSnapshot();

      expect(transaction.isDeleted()).toBe(true);
      expect(updatedSnapshot.version).toBe(originalSnapshot.version);
      expect(updatedSnapshot.updatedAt).toBe(originalSnapshot.updatedAt);
    });
  });

  describe('Transaction Domain Invariants coverage', () => {
    it('should accept a multi-currency transaction balanced by value even when amounts do not sum to zero', () => {
      const data = TransactionBuilder.request({
        accounts: ['USD', 'RUB'],
        operations: [
          {
            accountKey: 'USD',
            amount: '-10000',
            value: '-100',
          },
          {
            accountKey: 'RUB',
            amount: '900000',
            value: '100',
          },
        ],
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      expect(() =>
        Transaction.create(user.getId(), transactionData),
      ).not.toThrow();
    });

    it('should reject a multi-currency transaction with balanced amounts but unbalanced values', () => {
      const data = TransactionBuilder.request({
        accounts: ['USD', 'RUB'],
        operations: [
          {
            accountKey: 'USD',
            amount: '-10000',
            value: '-100',
          },
          {
            accountKey: 'RUB',
            amount: '10000',
            value: '90',
          },
        ],
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      expect(() => Transaction.create(user.getId(), transactionData)).toThrow(
        UnbalancedTransactionError,
      );
    });

    it('should validate a multi-currency operation patch by value rather than amount', () => {
      const data = TransactionBuilder.request({
        accounts: ['USD', 'RUB'],
        operations: [
          {
            accountKey: 'USD',
            amount: '-10000',
            value: '-100',
          },
          {
            accountKey: 'RUB',
            amount: '900000',
            value: '100',
          },
        ],
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );
      const transaction = Transaction.create(user.getId(), transactionData);
      const operationToUpdate = transaction.getOperations()[1];

      expect(() =>
        transaction.applyUpdate({
          operations: {
            create: [],
            delete: [],
            update: [
              {
                account: data.getAccountByKey('RUB'),
                amount: Amount.create('10000'),
                description: operationToUpdate.description,
                id: operationToUpdate.getId(),
                value: Amount.create('90'),
              },
            ],
          },
        }),
      ).toThrow(UnbalancedTransactionError);
    });

    it('should reject create when resulting operations do not sum to zero', () => {
      const operationsData = [
        operationsData1,
        operationsData2,
        operationsData3,
      ];

      const data = TransactionBuilder.request({
        accounts: ['USD', 'EUR', 'RUB', 'TRY'],
        operations: operationsData,
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      expect(() => Transaction.create(user.getId(), transactionData)).toThrow(
        UnbalancedTransactionError,
      );
    });

    it('should reject update when resulting operations do not sum to zero', () => {
      const operationsData = [
        {
          accountKey: 'USD',
          amount: '5000',
          description: 'groceries Account',
        },
        {
          accountKey: 'USD',
          amount: '-10000',
          description: 'USD Wallet adjustment',
        },
        {
          accountKey: 'USD',
          amount: '4000',
          description: 'fuel Account',
        },
        {
          accountKey: 'USD',
          amount: '1000',
          description: 'USD phone bill Account',
        },
      ];

      const data = TransactionBuilder.request({
        accounts: ['USD', 'EUR', 'RUB', 'TRY'],
        operations: operationsData,
        settings: transactionRawData,
        user,
      });

      const usdAccount = data.getAccountByKey('USD');

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();
      const originalVersion = transaction.getVersion();

      const operationsPatchData = {
        operations: {
          create: [
            {
              account: usdAccount,
              amount: Amount.create('7777'),
              description: 'New Operation',
              value: Amount.create('7777'),
            },
          ],
          delete: [],
          update: [],
        },
      };

      expect(() => transaction.applyUpdate(operationsPatchData)).toThrow(
        UnbalancedTransactionError,
      );

      expect(transaction.toSnapshot()).toEqual(originalSnapshot);

      expect(transaction.getVersion()).toEqual(originalVersion);
    });

    it('should reject creation with zero operations', () => {
      const data = TransactionBuilder.request({
        accounts: ['USD', 'EUR', 'RUB', 'TRY'],
        operations: [],
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      expect(() => Transaction.create(user.getId(), transactionData)).toThrow(
        InsufficientOperationsError,
      );
    });

    it('should reject creation with one operation', () => {
      const operationsData = [
        {
          accountKey: 'USD',
          amount: '0',
          description: 'groceries Account',
        },
      ];

      const data = TransactionBuilder.request({
        accounts: ['USD', 'EUR', 'RUB', 'TRY'],
        operations: operationsData,
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      expect(() => Transaction.create(user.getId(), transactionData)).toThrow(
        InsufficientOperationsError,
      );
    });

    it('should allow creation with the maximum number of operations', () => {
      const transaction = Transaction.create(user.getId(), {
        ...transactionData,
        operations: createBalancedOperations(MAX_TRANSACTION_OPERATIONS),
      });

      expect(transaction.getOperations()).toHaveLength(
        MAX_TRANSACTION_OPERATIONS,
      );
    });

    it('should reject creation with more than the maximum number of operations', () => {
      expect(() =>
        Transaction.create(user.getId(), {
          ...transactionData,
          operations: createBalancedOperations(MAX_TRANSACTION_OPERATIONS + 1),
        }),
      ).toThrow(ExcessiveOperationsError);
    });

    it('should reject updating to fewer than two operations', () => {
      const operationsData = [
        {
          accountKey: 'USD',
          amount: '-100000',
          description: 'groceries Account',
        },
        {
          accountKey: 'USD',
          amount: '100000',
          description: 'groceries Account',
        },
      ];

      const data = TransactionBuilder.request({
        accounts: ['USD', 'EUR', 'RUB', 'TRY'],
        operations: operationsData,
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();
      const originalVersion = transaction.getVersion();

      const operationsPatchData = {
        operations: {
          create: [],
          delete: [transaction.getOperations()[0].getId()],
          update: [],
        },
      };

      expect(() => transaction.applyUpdate(operationsPatchData)).toThrow(
        InsufficientOperationsError,
      );

      expect(transaction.toSnapshot()).toEqual(originalSnapshot);

      expect(transaction.getVersion()).toEqual(originalVersion);
    });

    it('should reject an update that exceeds the maximum number of operations', () => {
      const transaction = Transaction.create(user.getId(), {
        ...transactionData,
        operations: createBalancedOperations(MAX_TRANSACTION_OPERATIONS),
      });

      const originalSnapshot = transaction.toSnapshot();

      expect(() =>
        transaction.applyUpdate({
          operations: {
            create: createBalancedOperations(2),
            delete: [],
            update: [],
          },
        }),
      ).toThrow(ExcessiveOperationsError);

      expect(transaction.toSnapshot()).toEqual(originalSnapshot);
    });

    it('should allow replacing operations without exceeding the maximum', () => {
      const transaction = Transaction.create(user.getId(), {
        ...transactionData,
        operations: createBalancedOperations(MAX_TRANSACTION_OPERATIONS),
      });

      const operationsToDelete = transaction
        .getOperations()
        .slice(0, 2)
        .map((operation) => operation.getId());

      transaction.applyUpdate({
        operations: {
          create: createBalancedOperations(2),
          delete: operationsToDelete,
          update: [],
        },
      });

      expect(transaction.getOperations()).toHaveLength(
        MAX_TRANSACTION_OPERATIONS,
      );
    });

    it('should allow delete and create when two balanced operations remain', () => {
      const operationsData = [
        {
          accountKey: 'USD',
          amount: '-100000',
          description: 'groceries Account',
        },
        {
          accountKey: 'USD',
          amount: '100000',
          description: 'groceries Account',
        },
      ];

      const data = TransactionBuilder.request({
        accounts: ['USD', 'EUR', 'RUB', 'TRY'],
        operations: operationsData,
        settings: transactionRawData,
        user,
      });

      const transactionData = TransactionMapper.toCreateTransactionProps(
        data.transactionDTO,
        data.transactionContext,
      );

      const transaction = Transaction.create(user.getId(), transactionData);

      const initialVersion = transaction.getVersion();

      const operationToDelete = transaction.getOperations()[1];
      const replacementDescription = 'Replacement operation';

      const operationsPatchData = {
        operations: {
          create: [
            {
              account: data.getAccountByKey('USD'),
              amount: Amount.create('100000'),
              description: replacementDescription,
              value: Amount.create('100000'),
            },
          ],
          delete: [operationToDelete.getId()],
          update: [],
        },
      };

      transaction.applyUpdate(operationsPatchData);

      expect(transaction.getOperations()).toHaveLength(operationsData.length);

      expect(
        transaction
          .getOperations()
          .some(({ description }) => description === replacementDescription),
      ).toBe(true);

      expect(
        transaction
          .getOperations()
          .some((operation) =>
            operation.getId().equals(operationToDelete.getId()),
          ),
      ).toBe(false);

      expect(
        transaction
          .getAllOperations()
          .find((operation) => operation.getId().equals(operationToDelete.id))
          ?.isDeleted(),
      ).toBe(true);

      expect(
        transaction
          .getOperations()
          .reduce(
            (sum, operation) => sum.add(operation.value),
            Amount.create('0'),
          )
          .isZero(),
      ).toBe(true);

      expect(transaction.getVersion().valueOf()).toBe(
        initialVersion.valueOf() + 1,
      );
    });

    it.todo(
      '[TXN-3] should allow repeated account usage when account net effect is non-zero',
    );
    it.todo(
      '[TXN-3] should reject repeated account usage when account net effect is zero',
    );

    it.todo(
      '[TXN-4] should allow creation with one distinct account when base invariants hold',
    );
    it.todo(
      '[TXN-4] should allow update that leaves one distinct account when base invariants hold',
    );

    it.todo('[TXN-5] should reject creation with zero amount operations');
    it.todo('[TXN-5] should reject update with zero amount operations');

    it.todo('[TXN-6] should reject missing, NaN, and Infinity amounts');

    it.todo('[TXN-7] should reject missing transaction currency');
    it.todo('[TXN-7] should reject unknown transaction currency');

    it.todo(
      '[TXN-8] should reject operations whose accounts do not belong to transaction user',
    );

    it.todo('[TXN-9] should reject update when expected version mismatches');

    it.todo('[TXN-10] should reject update after transaction is deleted');

    it.todo('[TXN-11] should reject creation without transaction date');
    it.todo('[TXN-11] should reject update without transaction date');

    it.todo('[TXN-12] should reject creation above operations count limit');
    it.todo('[TXN-12] should reject update above operations count limit');

    it.todo(
      '[TXN-13] should reject transactions without both positive and negative operations',
    );
  });

  describe('Operations', () => {
    it.todo('should not return soft deleted operations');
  });
});
