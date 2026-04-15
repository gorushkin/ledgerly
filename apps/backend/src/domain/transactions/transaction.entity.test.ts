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
  CreateOperationProps,
  OperationProps,
  OperationSnapshot,
  UpdateOperationProps,
} from '../operations/types';
import { User } from '../users/user.entity';

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

  const operationsData = [
    {
      accountKey: 'USD',
      amount: '10000',
      description: 'groceries Account',
    },
    {
      accountKey: 'USD',
      amount: '-10000',
      description: 'USD Wallet adjustment',
    },
    {
      accountKey: 'EUR',
      amount: '50000',
      description: 'fuel Account',
    },
    {
      accountKey: 'EUR',
      amount: '-50000',
      description: 'EUR Wallet adjustment',
    },
  ];

  beforeAll(async () => {
    user = await createUser();

    const transactionBuilder = TransactionBuilder.create(user);

    data = transactionBuilder
      .withSettings(transactionRawData)
      .withAccounts(['USD', 'EUR', 'RUB', 'TRY'])
      .withOperations(operationsData)
      .build();

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
  });

  describe('Updating Transaction data', () => {
    it('Should update only description, increment version and update timestamps', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const description = 'Updated transaction description';
      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      transaction.applyUpdate(
        { metadata: { ...metadata, description } },
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
      const transaction = Transaction.create(user.getId(), transactionData);

      const postingDate = DateValue.restore('2024-02-15').valueOf();

      const originalSnapshot = transaction.toSnapshot();

      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        { metadata: { ...metadata, postingDate } },
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
      const transaction = Transaction.create(user.getId(), transactionData);

      const transactionDate = DateValue.restore('2024-03-10').valueOf();

      const originalSnapshot = transaction.toSnapshot();

      vi.advanceTimersByTime(5000);

      const metadata = TransactionMapper.toMetadataUpdateData(transaction);

      transaction.applyUpdate(
        { metadata: { ...metadata, transactionDate } },
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
      const transaction = Transaction.create(user.getId(), transactionData);

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

    it.skip('Should update an existing operation and increase version', () => {
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
        const matchedPrevOp = updatedOperationData.find((prevOp) =>
          prevOp.id.equals(op.id),
        );

        expect(matchedPrevOp).toBeDefined();

        expect(op.accountId).toBe(matchedPrevOp?.account.getId().valueOf());
        expect(op.amount).toBe(matchedPrevOp?.amount.valueOf());
        expect(op.description).toBe(matchedPrevOp?.description);
        expect(op.value).toBe(matchedPrevOp?.value.valueOf());
      });
    });

    it('Should delete an existing operation, filter deleted operations from snapshot and increase version', () => {
      const transaction = Transaction.create(user.getId(), transactionData);

      const originalSnapshot = transaction.toSnapshot();

      const operationsToDelete = [
        transaction.getOperations()[0],
        transaction.getOperations()[1],
      ].map((op) => op.getId());

      const operationsToDeleteIds = operationsToDelete.map((op) =>
        op.valueOf(),
      );

      const operationsSnapshotFiltered = originalSnapshot.operations.filter(
        (op) => !operationsToDeleteIds.includes(op.id),
      );

      vi.advanceTimersByTime(5000);

      transaction.applyUpdate(
        {
          operations: {
            create: [],
            delete: operationsToDelete,
            update: [],
          },
        },
        data.transactionContext,
      );

      const updatedSnapshot = transaction.toSnapshot();

      expect(new Date(originalSnapshot.updatedAt).getTime()).toBeLessThan(
        new Date(updatedSnapshot.updatedAt).getTime(),
      );

      const deletedOperation = operationsSnapshotFiltered.find((op) =>
        operationsToDeleteIds.includes(op.id),
      );

      expect(deletedOperation).not.toBeDefined();

      const deletedOperationSnapshot = updatedSnapshot.operations.filter(
        (op) => op.id === operationsToDeleteIds[0],
      );

      expect(deletedOperationSnapshot).toHaveLength(0);

      operationsSnapshotFiltered.forEach((op) => {
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

      const operations = transaction.getOperations();

      operations.forEach((operation) => {
        expect(operation.isDeleted()).toBe(true);
      });
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

  describe('Validation', () => {
    it('Should validate that sum of operation values is 0', () => {
      expect(() => {
        Transaction.create(user.getId(), transactionData);
      }).not.toThrowError(UnbalancedTransactionError);
    });

    it('Should fail validation if sum of operation values is not 0', () => {
      const usdAccount = data.getAccountByKey('USD');

      const unbalancedOperationsData: OperationProps[] = [
        {
          account: usdAccount,
          amount: Amount.create('10000'),
          description: 'groceries Account',
          value: Amount.create('10000'),
        },
        {
          account: usdAccount,
          amount: Amount.create('10000'),
          description: 'Wallet adjustment',
          value: Amount.create('10000'),
        },
      ];

      expect(() => {
        Transaction.create(user.getId(), {
          ...transactionData,
          operations: unbalancedOperationsData,
        });
      }).toThrowError(UnbalancedTransactionError);
    });
  });

  describe('Operations', () => {
    it.todo('should not return soft deleted operations');
  });
});
