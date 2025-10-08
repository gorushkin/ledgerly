import { Id } from 'src/domain/domain-core/value-objects/Id';
import { describe, expect, it } from 'vitest';

import { Amount } from '../domain-core';

import { Operation } from './operation.entity';

const userIdValue = Id.restore(
  '123e4567-e89b-12d3-a456-426614174000',
).valueOf();

const accountId = Id.restore('223e4567-e89b-12d3-a456-426614174000');

const userId = Id.restore(userIdValue);

describe('Operation Domain Entity', () => {
  it('should create a valid operation', () => {
    const operation = Operation.create(
      userId,
      accountId,
      Amount.create('100'),
      'Test operation',
    );

    expect(operation).toBeInstanceOf(Operation);
    expect(operation.userId).toEqual(userId);
    expect(operation.accountId).toEqual(accountId);
    expect(operation.amount).toEqual(Amount.create('100'));
    expect(operation.isSystem).toBe(false);
    expect(operation.id).toBeDefined();
    expect(operation.createdAt).toBeDefined();
    expect(operation.updatedAt).toBeDefined();
  });

  it('should serialize and deserialize correctly', () => {
    const operation = Operation.create(
      userId,
      accountId,
      Amount.create('100'),
      'Test operation',
    );

    const persistenceData = operation.toPersistence();

    const restoredOperation = Operation.fromPersistence({
      ...persistenceData,
      userId: userId.valueOf(),
    });

    expect(restoredOperation.toPersistence()).toEqual(
      operation.toPersistence(),
    );
  });

  // it('should throw an error for currency mismatch on add', () => {
  //   const operation = Operation.create(
  //     userId,
  //     accountId,
  //     Amount.create('100'),
  //     'Test operation',
  //   );

  //   const differentCurrencyAmount = Amount.create('50');

  //   expect(() => {
  //     operation.amount.add(differentCurrencyAmount);
  //   }).toThrow('Currency mismatch');
  // });

  // it('should throw an error for currency mismatch on subtract', () => {
  //   const operation = Operation.create(
  //     userId,
  //     accountId,
  //     Money.create('100', 'USD'),
  //     'Test operation',
  //   );

  //   const differentCurrencyMoney = Money.create('50', 'EUR');

  //   expect(() => {
  //     operation.amount.subtract(differentCurrencyMoney);
  //   }).toThrow('Currency mismatch');
  // });

  it('should allow zero amount operations', () => {
    const operation = Operation.create(
      userId,
      accountId,
      Amount.create('0'),
      'Zero amount operation',
    );

    expect(operation.amount.valueOf()).toBe('0');
  });

  it('should handle negative amounts correctly', () => {
    const operation = Operation.create(
      userId,
      accountId,
      Amount.create('-50'),
      'Negative amount operation',
    );

    expect(operation.amount.valueOf()).toBe('-50');
  });

  describe('calculations', () => {
    it('should add amounts correctly', () => {
      const operation1 = Operation.create(
        userId,
        accountId,
        Amount.create('100'),
        'Test operation 1',
      );

      const operation2 = Operation.create(
        userId,
        accountId,
        Amount.create('50'),
        'Test operation 2',
      );

      const result = operation1.amount.add(operation2.amount);

      expect(result.valueOf()).toBe('150');
    });
    it('should subtract amounts correctly', () => {
      const operation1 = Operation.create(
        userId,
        accountId,
        Amount.create('100'),
        'Test operation 1',
      );

      const operation2 = Operation.create(
        userId,
        accountId,
        Amount.create('50'),
        'Test operation 2',
      );

      const result = operation1.amount.subtract(operation2.amount);

      expect(result.valueOf()).toBe('50');
    });
  });
  // Add more tests as needed for edge cases and other behaviors
});
