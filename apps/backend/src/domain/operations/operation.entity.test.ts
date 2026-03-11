import { createUser } from 'src/db/createTestUser';
import { compareEntities, TransactionBuilder } from 'src/db/test-utils';
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

import { Account } from '../accounts';
import { Amount, Id } from '../domain-core';
import { Transaction } from '../transactions';
import { User } from '../users/user.entity';

import { Operation } from './operation.entity';

describe('Operation Domain Entity', () => {
  let user: User;
  let userId: Id;
  let transaction: Transaction;
  let usdAccount: Account;
  let eurAccount: Account;

  const transactionData: TransactionProps = {
    currencyCode: 'USD',
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  beforeAll(async () => {
    user = await createUser();
    userId = user.getId();

    const transactionBuilder = TransactionBuilder.create(user);

    const data = transactionBuilder
      .withSettings(transactionData)
      .withAccounts(['USD', 'EUR'])
      .build();

    usdAccount = data.getAccountByKey('USD');
    eurAccount = data.getAccountByKey('EUR');
    transaction = data.transaction;
  });

  it('should create a valid operation', () => {
    const operationData = {
      amount: Amount.create('100'),
      description: 'Test operation',
      value: Amount.create('300'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    expect(operation).toBeInstanceOf(Operation);
    expect(operation.getUserId().valueOf()).toEqual(user.getId().valueOf());
    expect(operation.getAccountId().valueOf()).toEqual(
      usdAccount.getId().valueOf(),
    );

    expect(operation.id).toBeDefined();
    expect(operation.getCreatedAt()).toBeDefined();
    expect(operation.getUpdatedAt()).toBeDefined();
    expect(operation.value.equals(operationData.value)).toEqual(true);
    expect(operation.amount.equals(operationData.amount)).toEqual(true);
  });

  it('should update an operation', () => {
    const operationData = {
      amount: Amount.create('100'),
      description: 'Test operation',
      value: Amount.create('300'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    const newDescription = 'Updated description';
    const newAmount = Amount.create('150');
    const newValue = Amount.create('350');

    const operationSnapshot = operation.toSnapshot();

    vi.advanceTimersByTime(5000);

    operation.update({
      account: usdAccount,
      amount: newAmount,
      description: newDescription,
      id: operation.id,
      value: newValue,
    });

    const updatedSnapshot = operation.toSnapshot();

    expect(operation.description).toEqual(newDescription);
    expect(operation.amount.equals(newAmount)).toBe(true);
    expect(operation.value.equals(newValue)).toBe(true);

    expect(new Date(updatedSnapshot.updatedAt).getTime()).toBeGreaterThan(
      new Date(operationSnapshot.updatedAt).getTime(),
    );

    compareEntities(
      {
        ...operationSnapshot,
      },
      updatedSnapshot,
      ['updatedAt', 'amount', 'value', 'description'],
    );
  });

  it('should update an operation with a new account', () => {
    const operationData = {
      amount: Amount.create('100'),
      description: 'Test operation',
      value: Amount.create('300'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    const operationSnapshot = operation.toSnapshot();

    operation.update({
      account: eurAccount,
      amount: operationData.amount,
      description: operationData.description,
      id: operation.id,
      value: operationData.value,
    });

    const updatedSnapshot = operation.toSnapshot();

    expect(operation.getAccountId().valueOf()).toEqual(
      eurAccount.getId().valueOf(),
    );

    compareEntities(
      {
        ...operationSnapshot,
      },
      updatedSnapshot,
      ['updatedAt', 'accountId'],
    );
  });

  it('should not update if data is the same', () => {
    const operationData = {
      amount: Amount.create('100'),
      description: 'Test operation',
      value: Amount.create('300'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    const operationSnapshot = operation.toSnapshot();

    vi.advanceTimersByTime(5000);

    operation.update({
      account: usdAccount,
      amount: operationData.amount,
      description: operationData.description,
      id: operation.id,
      value: operationData.value,
    });

    const updatedSnapshot = operation.toSnapshot();

    compareEntities(operationSnapshot, updatedSnapshot);
  });

  it('should mark an operation as deleted', () => {
    const operationData = {
      amount: Amount.create('100'),
      description: 'Test operation',
      value: Amount.create('300'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    const operationSnapshot = operation.toSnapshot();

    expect(operation.isDeleted()).toBe(false);

    operation.markAsDeleted();

    const deletedSnapshot = operation.toSnapshot();

    expect(deletedSnapshot.isTombstone).toBe(true);

    compareEntities(
      {
        ...operationSnapshot,
        isTombstone: true,
      },
      deletedSnapshot,
      ['updatedAt'],
    );

    expect(operation.isDeleted()).toBe(true);
  });

  it('should serialize and deserialize correctly', () => {
    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      Amount.create('100'),
      Amount.create('100'),
      'Test operation',
    );

    const snapshot = operation.toSnapshot();

    const restoredOperation = Operation.restore(snapshot);

    expect(restoredOperation.toSnapshot()).toEqual(operation.toSnapshot());
  });

  it('should allow zero amount operations', () => {
    const operationData = {
      amount: Amount.create('0'),
      description: 'Zero amount operation',
      value: Amount.create('0'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    expect(operation.amount.equals(operationData.amount)).toBe(true);
  });

  it('should handle negative amounts correctly', () => {
    const operationData = {
      amount: Amount.create('-50'),
      description: 'Negative amount operation',
      value: Amount.create('-50'),
    };

    const operation = Operation.create(
      userId,
      usdAccount,
      transaction,
      operationData.amount,
      operationData.value,
      operationData.description,
    );

    expect(operation.amount.equals(operationData.amount)).toBe(true);
  });

  describe('calculations', () => {
    it('should add amounts correctly', () => {
      const operationData1 = {
        amount: Amount.create('100'),
        description: 'Test operation',
        value: Amount.create('100'),
      };

      const operationData2 = {
        amount: Amount.create('50'),
        description: 'Test operation 2',
        value: Amount.create('50'),
      };

      const operation1 = Operation.create(
        userId,
        usdAccount,
        transaction,
        operationData1.amount,
        operationData1.value,
        operationData1.description,
      );

      const operation2 = Operation.create(
        userId,
        usdAccount,
        transaction,
        operationData2.amount,
        operationData2.value,
        operationData2.description,
      );

      const result = operation1.amount.add(operation2.amount);

      expect(result.equals(Amount.create('150'))).toBe(true);
    });

    it('should subtract amounts correctly', () => {
      const operationData1 = {
        amount: Amount.create('100'),
        description: 'Test operation',
        value: Amount.create('100'),
      };

      const operationData2 = {
        amount: Amount.create('50'),
        description: 'Test operation 2',
        value: Amount.create('50'),
      };

      const operation1 = Operation.create(
        userId,
        usdAccount,
        transaction,
        operationData1.amount,
        operationData1.value,
        operationData1.description,
      );

      const operation2 = Operation.create(
        userId,
        usdAccount,
        transaction,
        operationData2.amount,
        operationData2.value,
        operationData2.description,
      );

      const result = operation1.amount.subtract(operation2.amount);

      expect(result.equals(Amount.create('50'))).toBe(true);
    });
  });
});
