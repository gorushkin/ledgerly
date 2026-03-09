import { createUser } from 'src/db/createTestUser';
import {
  compareEntities,
  TransactionBuilder,
  TransactionBuilderResult,
} from 'src/db/test-utils';
import { TransactionProps } from 'src/db/test-utils/testEntityBuilder';
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { Amount, DateValue } from '../domain-core';
import { UnbalancedTransactionError } from '../domain.errors';
import {
  OperationDraft,
  OperationSnapshot,
  OperationUpdate,
} from '../operations/types';
import { User } from '../users/user.entity';

import { Transaction } from './transaction.entity';

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

  const transactionData: TransactionProps = {
    currencyCode: 'USD',
    description: 'Buy groceries',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
  };

  const operationsData = [
    {
      accountKey: 'USD',
      amount: '10000',
      description: 'groceries Account',
    },
    {
      accountKey: 'USD',
      amount: '-10000',
      description: 'Wallet adjustment',
    },
  ];

  beforeAll(async () => {
    user = await createUser();

    const transactionBuilder = TransactionBuilder.create(user);

    data = transactionBuilder
      .withSettings(transactionData)
      .withAccounts(['USD', 'EUR', 'RUB', 'TRY'])
      .withOperations(operationsData)
      .build();
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Creation and Restoration', () => {
    it('should create a valid transaction with operation', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      expect(transaction).toBeInstanceOf(Transaction);
      expect(transaction.description).toBe(transactionData.description);
      expect(transaction.getPostingDate().valueOf()).toEqual(
        transactionData.postingDate,
      );
      expect(transaction.getTransactionDate().valueOf()).toEqual(
        transactionData.transactionDate,
      );
      expect(transaction.getId()).toBeDefined();
      expect(transaction.getCreatedAt()).toBeDefined();
      expect(transaction.getUpdatedAt()).toBeDefined();
      expect(transaction.isDeleted()).toBe(false);

      expect(transaction.currency.valueOf()).toBe(transactionData.currencyCode);

      const transactionOperations = transaction.getOperations();

      expect(transactionOperations).toHaveLength(operationsData.length);

      transactionOperations.forEach((op, index) => {
        const matchedOpData = operationsData[index];
        expect(op.amount.valueOf()).toBe(matchedOpData.amount);
        expect(op.description).toBe(matchedOpData.description);
      });
    });

    it('should serialize and deserialize correctly', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const transactionSnapshot = transaction.toSnapshot();

      expect(transactionSnapshot).toMatchObject({
        description: transactionData.description,
        postingDate: transactionData.postingDate,
        transactionDate: transactionData.transactionDate,
        userId: user.getId().valueOf(),
      });

      const restoredTransaction = Transaction.restore(transactionSnapshot);
      expect(restoredTransaction.toSnapshot()).toEqual(transactionSnapshot);
    });
  });

  describe('Updating Transaction data', () => {
    it('Should update only description, increment version and update timestamps', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const description = 'Updated transaction description';
      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        { metadata: { description } },
        data.transactionContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

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
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const postingDate = DateValue.restore('2024-02-15').valueOf();

      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        { metadata: { postingDate } },
        data.transactionContext,
      );

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
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const transactionDate = DateValue.restore('2024-03-10').valueOf();

      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        { metadata: { transactionDate } },
        data.transactionContext,
      );
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
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const originalSnapshot = transaction.toSnapshot();

      const description = 'Fully updated transaction';
      const postingDate = DateValue.restore('2024-04-01').valueOf();
      const transactionDate = DateValue.restore('2024-04-05').valueOf();

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        {
          metadata: { description, postingDate, transactionDate },
        },
        data.transactionContext,
      );

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
    it('Should add a new operation and increase version', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const originalSnapshot = transaction.toSnapshot();

      const prevOperations: OperationUpdate[] = transaction
        .getOperations()
        .map((op) => ({
          accountId: op.getAccountId().valueOf(),
          amount: op.amount.valueOf(),
          description: op.description,
          id: op.getId().valueOf(),
          value: op.value.valueOf(),
        }));

      const newOperationData1: OperationDraft = {
        accountId: data.getAccountByKey('USD').getId().valueOf(),
        amount: Amount.create('5000').valueOf(),
        description: 'New Operation',
        value: Amount.create('5000').valueOf(),
      };

      const newOperationData2: OperationDraft = {
        accountId: data.getAccountByKey('USD').getId().valueOf(),
        amount: Amount.create('-5000').valueOf(),
        description: 'New Operation',
        value: Amount.create('-5000').valueOf(),
      };

      const operationsToAdd = [newOperationData1, newOperationData2];

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        {
          operations: {
            create: operationsToAdd,
            delete: [],
            update: [],
          },
        },
        data.transactionContext,
      );

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
            newOp.accountId === op.accountId &&
            newOp.amount === op.amount &&
            newOp.description === op.description &&
            newOp.value === op.value,
        );

        expect(matchedNewOp).toBeDefined();
        expect(op.accountId).toBe(matchedNewOp?.accountId);
        expect(op.amount).toBe(matchedNewOp?.amount);
        expect(op.description).toBe(matchedNewOp?.description);
        expect(op.value).toBe(matchedNewOp?.value);
      });
    });

    it('Should update an existing operation and increase version', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const originalSnapshot = transaction.toSnapshot();

      const prevOperations: OperationUpdate[] = transaction
        .getOperations()
        .map((op) => ({
          accountId: op.getAccountId().valueOf(),
          amount: op.amount.valueOf(),
          description: op.description,
          id: op.getId().valueOf(),
          value: op.value.valueOf(),
        }));

      const [operationToUpdate1, operationToUpdate2] = prevOperations;

      const updatedOperationData: OperationUpdate[] = [
        {
          accountId: operationToUpdate1.accountId,
          amount: Amount.create('20000').valueOf(),
          description: 'Updated Operation',
          id: operationToUpdate1.id,
          value: Amount.create('20000').valueOf(),
        },
        {
          accountId: operationToUpdate2.accountId,
          amount: Amount.create('-20000').valueOf(),
          description: 'Updated Operation',
          id: operationToUpdate2.id,
          value: Amount.create('-20000').valueOf(),
        },
      ];

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        {
          operations: {
            create: [],
            delete: [],
            update: updatedOperationData,
          },
        },
        data.transactionContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(transaction.getOperations()).toHaveLength(prevOperations.length);

      expect(updatedSnapshot.version).toBe(originalSnapshot.version + 1);

      updatedSnapshot.operations.forEach((op) => {
        const matchedPrevOp = updatedOperationData.find(
          (prevOp) => op.id === prevOp.id,
        );

        expect(matchedPrevOp).toBeDefined();

        expect(op.accountId).toBe(matchedPrevOp?.accountId);
        expect(op.amount).toBe(matchedPrevOp?.amount);
        expect(op.description).toBe(matchedPrevOp?.description);
        expect(op.value).toBe(matchedPrevOp?.value);
      });
    });

    it('Should delete an existing operation and increase version', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const originalSnapshot = transaction.toSnapshot();

      const operationToDeleteSnapshot = originalSnapshot.operations[0];

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        {
          operations: {
            create: [],
            delete: [operationToDeleteSnapshot.id],
            update: [],
          },
        },
        data.transactionContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      const operationsAfterDelete = transaction.getOperations();

      const deletedOperation = operationsAfterDelete.find(
        (op) => op.getId().valueOf() === operationToDeleteSnapshot.id,
      );

      expect(deletedOperation).toBeDefined();

      expect(deletedOperation?.isDeleted()).toBe(true);

      const deletedOperationSnapshot = updatedSnapshot.operations.find(
        (op) => op.id === operationToDeleteSnapshot.id,
      );

      expect(deletedOperationSnapshot).toBeDefined();

      compareEntities(deletedOperationSnapshot!, operationToDeleteSnapshot, [
        'isTombstone',
        'updatedAt',
      ]);

      updatedSnapshot.operations.forEach((op) => {
        const matchedPrevOp = originalSnapshot.operations.find(
          (prevOp) => op.id === prevOp.id,
        );

        expect(matchedPrevOp).toBeDefined();

        if (matchedPrevOp?.id === operationToDeleteSnapshot.id) {
          expect(op.isTombstone).toBe(true);
          compareEntities(matchedPrevOp, op, ['isTombstone', 'updatedAt']);
          return;
        }

        compareEntities(op, matchedPrevOp!);
      });
    });
  });

  describe('Deletion', () => {
    it('should mark transaction as deleted and all related operations, increase version and update timestamps', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );

      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      transaction.markAsDeleted();

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      expect(updatedSnapshot.version).toBe(originalSnapshot.version + 1);

      expect(transaction.isDeleted()).toBe(true);

      const operations = transaction.getOperations();

      operations.forEach((operation) => {
        expect(operation.isDeleted()).toBe(true);
      });
    });

    it('Should not increase version if transaction is already deleted', () => {
      const transaction = Transaction.create(
        user.getId(),
        data.transactionDTO,
        data.transactionContext,
      );
      transaction.markAsDeleted();

      const originalSnapshot = transaction.toSnapshot();

      transaction.markAsDeleted();

      const updatedSnapshot = transaction.toSnapshot();

      expect(transaction.isDeleted()).toBe(true);
      expect(updatedSnapshot.version).toBe(originalSnapshot.version);
      expect(updatedSnapshot.updatedAt).toBe(originalSnapshot.updatedAt);
    });
  });

  describe('Validation', () => {
    it('Should validate that sum of operation values is 0', () => {
      expect(() => {
        Transaction.create(
          user.getId(),
          data.transactionDTO,
          data.transactionContext,
        );
      }).not.toThrowError(UnbalancedTransactionError);
    });

    it('Should fail validation if sum of operation values is not 0', () => {
      const usdAccountId = data.getAccountByKey('USD').getId().valueOf();
      const unbalancedOperationsData = [
        {
          accountId: usdAccountId,
          amount: Amount.create('10000').valueOf(),
          description: 'groceries Account',
          value: Amount.create('10000').valueOf(),
        },
        {
          accountId: usdAccountId,
          amount: Amount.create('10000').valueOf(),
          description: 'Wallet adjustment',
          value: Amount.create('10000').valueOf(),
        },
      ] satisfies OperationDraft[];

      expect(() => {
        Transaction.create(
          user.getId(),
          { ...data.transactionDTO, operations: unbalancedOperationsData },
          data.transactionContext,
        );
      }).toThrowError(UnbalancedTransactionError);
    });
  });
});
