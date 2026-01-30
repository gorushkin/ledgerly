import { createUser } from 'src/db/createTestUser';
import { TransactionBuilder } from 'src/db/test-utils';
import { beforeAll, describe, expect, it } from 'vitest';

import { Account } from '../accounts';
import { Amount } from '../domain-core';
import { Entry } from '../entries';
import { User } from '../users/user.entity';

import { Operation } from './operation.entity';

describe('Operation Domain Entity', () => {
  let user: User;
  let entry: Entry;
  let account: Account;

  const transactionData = {
    description: 'Test transaction',
    postingDate: '2024-01-01',
    transactionDate: '2024-01-01',
    userId: '123e4567-e89b-12d3-a456-426614174000',
  };

  const entriesData = [
    {
      description: 'First Entry',
      operations: [
        { accountKey: 'USD', amount: '10000', description: '1' },
        { accountKey: 'USD', amount: '-10000', description: '2' },
      ],
    },
  ];

  beforeAll(async () => {
    user = await createUser();

    const transactionBuilder = TransactionBuilder.create(user);

    const data = transactionBuilder
      .withSettings(transactionData)
      .withAccounts(['USD', 'EUR'])
      .withSystemAccounts()
      .withEntries(entriesData)
      .build();

    entry = data.entries[0];
    account = data.getAccountByKey('USD');
  });

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
    expect(operation.id).toBeDefined();
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
