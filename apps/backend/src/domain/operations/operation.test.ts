import {
  createAccount,
  createEntry,
  createTransaction,
  createUser,
} from 'src/db/createTestUser';
import { describe, expect, it } from 'vitest';

import { Amount } from '../domain-core';

import { Operation } from './operation.entity';

describe('Operation Domain Entity', async () => {
  const user = await createUser();

  const account = createAccount(user);

  const transaction = createTransaction(user, {
    description: 'Test Transaction',
    postingDate: '2023-01-01',
    transactionDate: '2023-01-01',
  });

  const entry = createEntry(user, transaction, []);

  it('should create a valid operation', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('100'),
      'Test operation',
    );

    expect(operation).toBeInstanceOf(Operation);
    expect(operation.getUserId().valueOf()).toEqual(user.getId().valueOf());
    expect(operation.getAccountId().valueOf()).toEqual(
      account.getId().valueOf(),
    );
    expect(operation.amount.valueOf()).toEqual(Amount.create('100').valueOf());
    expect(operation.isSystem).toBe(false);
    expect(operation.getId()).toBeDefined();
    expect(operation.getCreatedAt()).toBeDefined();
    expect(operation.getUpdatedAt()).toBeDefined();
  });

  it('should serialize and deserialize correctly', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('100'),
      'Test operation',
    );

    const persistenceData = operation.toPersistence();

    const restoredOperation = Operation.fromPersistence({
      ...persistenceData,
      currencyCode: account.getCurrency().valueOf(),
      userId: user.getId().valueOf(),
    });

    expect(restoredOperation.toPersistence()).toEqual(
      operation.toPersistence(),
    );
  });

  it('should allow zero amount operations', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('0'),
      'Zero amount operation',
    );

    expect(operation.amount.valueOf()).toBe('0');
  });

  it('should handle negative amounts correctly', () => {
    const operation = Operation.create(
      user,
      account,
      entry,
      Amount.create('-50'),
      'Negative amount operation',
    );

    expect(operation.amount.valueOf()).toBe('-50');
  });

  describe('calculations', () => {
    it('should add amounts correctly', () => {
      const operation1 = Operation.create(
        user,
        account,
        entry,
        Amount.create('100'),
        'Test operation 1',
      );

      const operation2 = Operation.create(
        user,
        account,
        entry,
        Amount.create('50'),
        'Test operation 2',
      );

      const result = operation1.amount.add(operation2.amount);

      expect(result.valueOf()).toBe('150');
    });
    it('should subtract amounts correctly', () => {
      const operation1 = Operation.create(
        user,
        account,
        entry,
        Amount.create('100'),
        'Test operation 1',
      );

      const operation2 = Operation.create(
        user,
        account,
        entry,
        Amount.create('50'),
        'Test operation 2',
      );

      const result = operation1.amount.subtract(operation2.amount);

      expect(result.valueOf()).toBe('50');
    });
  });
  // Add more tests as needed for edge cases and other behaviors
});
