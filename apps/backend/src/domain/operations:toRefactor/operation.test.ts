import { Money } from '@ledgerly/shared/types';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { describe, it, expect } from 'vitest';

import { Operation } from './operation.entity';

const idString = 'a1b2c3d4-e5f6-4789-a123-456789abcdef';
const userIdString = '123e4567-e89b-12d3-a456-426614174000';
const entryIdString = '550e8400-e29b-41d4-a716-446655440000';
const accountIdString = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';

describe('Operation Domain Entity', () => {
  const userId = Id.create(userIdString);
  const entryId = Id.create(entryIdString);
  const accountId = Id.create(accountIdString);
  const amount = 100 as Money;
  const description = 'Test operation';

  describe('create method', () => {
    it('should create debit operation with valid data', () => {
      const operation = Operation.create(
        userId,
        entryId,
        accountId,
        amount,
        description,
      );

      expect(operation.id).toBeNull();
      expect(operation.entryId).toBe(entryId);
      expect(operation.accountId).toBe(accountId);
      expect(operation.amount).toBe(amount);
      expect(operation.description).toBe(description);
      expect(operation.isSystem).toBe(false);
    });

    it('should create system operation when isSystem is true', () => {
      const operation = Operation.create(
        userId,
        entryId,
        accountId,
        amount,
        description,
        true,
      );

      expect(operation.isSystem).toBe(true);
      expect(operation.isSystemGenerated()).toBe(true);
      expect(operation.canBeModified()).toBe(false);
    });

    it('should throw error for zero amount', () => {
      expect(() =>
        Operation.create(userId, entryId, accountId, 0 as Money),
      ).toThrow('Operation amount must be positive');
    });

    it('should throw error for negative amount', () => {
      expect(() =>
        Operation.create(userId, entryId, accountId, -50 as Money, 'debit'),
      ).toThrow('Operation amount must be positive');
    });

    it('should create operation without description', () => {
      const operation = Operation.create(userId, entryId, accountId, amount);

      expect(operation.description).toBe('');
    });
  });

  describe('restore', () => {
    it('should restore operation from database data', () => {
      const id = Id.create(idString);

      const operation = Operation.restore(
        userIdString,
        idString,
        entryIdString,
        accountIdString,
        amount,
        true,
        description,
      );

      expect(operation.id?.equals(id)).toBe(true);
      expect(operation.accountId.equals(accountId)).toBe(true);
      expect(operation.entryId.equals(entryId)).toBe(true);
      expect(operation.amount).toBe(amount);
      expect(operation.isSystem).toBe(true);
      expect(operation.description).toBe(description);
    });
  });

  describe('system operation methods', () => {
    it('should identify system operation', () => {
      const systemOp = Operation.create(
        userId,
        entryId,
        accountId,
        amount,
        '',
        true,
      );

      expect(systemOp.isSystemGenerated()).toBe(true);
      expect(systemOp.canBeModified()).toBe(false);
    });

    it('should identify regular operation', () => {
      const regularOp = Operation.create(userId, entryId, accountId, amount);

      expect(regularOp.isSystemGenerated()).toBe(false);
      expect(regularOp.canBeModified()).toBe(true);
    });
  });

  describe('getDisplayAmount', () => {
    it('should display debit amount with minus sign', () => {
      const debitOp = Operation.create(
        userId,
        entryId,
        accountId,
        123.45 as Money,
      );

      expect(debitOp.getDisplayAmount()).toBe('123.45');
    });

    it('should display credit amount with plus sign', () => {
      const creditOp = Operation.create(
        userId,
        entryId,
        accountId,
        -67.89 as Money,
      );

      expect(creditOp.getDisplayAmount()).toBe('-67.89');
    });

    it('should format amount to 2 decimal places', () => {
      const operation = Operation.create(
        userId,
        entryId,
        accountId,
        -100 as Money,
      );

      expect(operation.getDisplayAmount()).toBe('-100.00');
    });
  });

  describe('ID management', () => {
    it('should be new when created', () => {
      const operation = Operation.create(userId, entryId, accountId, amount);

      expect(operation.isNew()).toBe(true);
    });

    it('should not be new when restored', () => {
      const operation = Operation.restore(
        idString,
        userIdString,
        entryIdString,
        accountIdString,
        amount,
        false,
      );

      expect(operation.isNew()).toBe(false);
    });

    it('should set ID for new operation', () => {
      const operation = Operation.create(userId, entryId, accountId, amount);
      const newId = Id.create(idString);

      const operationWithId = operation.withId(newId);

      expect(operationWithId.id).toBe(newId);
      expect(operationWithId.entryId).toBe(entryId);
      expect(operationWithId.amount).toBe(amount);
    });

    it('should throw error when setting ID for existing operation', () => {
      const operation = Operation.restore(
        Id.create('existing-id'),
        userId,
        entryId,
        accountId,
        amount,

        false,
      );

      expect(() => operation.withId(Id.create('new-id'))).toThrow(
        'Cannot set ID for existing operation',
      );
    });
  });
});
