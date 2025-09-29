import { Money } from '@ledgerly/shared/types';
import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { IsoDatetimeString } from 'src/domain/domain-core/value-objects/IsoDateString';
import { describe, expect, it } from 'vitest';

import { Account } from './account.entity';

const userIdValue = Id.restore(
  '123e4567-e89b-12d3-a456-426614174000',
).valueOf();
const userTypeValue = 'asset';

const userId = Id.restore(userIdValue);

describe('Account Domain Entity', () => {
  const accountType = AccountType.create(userTypeValue);

  describe('create method', () => {
    it('should create account with valid data', () => {
      const account = Account.create(
        userId,
        'account-name',
        'account-description',
        0 as Money,
        'USD',
        accountType,
      );

      expect(account).toBeInstanceOf(Account);
      expect(account.id).toBeDefined();
      expect(account.userId).toBe(userId);
      expect(account).toHaveProperty('name', 'account-name');
      expect(account).toHaveProperty('description', 'account-description');
      expect(account).toHaveProperty('initialBalance', 0);
      expect(account).toHaveProperty('currency', 'USD');
      expect(account).toHaveProperty('type', { _value: 'asset' });
      expect(account.userId.equals(userId)).toBe(true);
      expect(account.belongsToUser(userId)).toBe(true);
      expect(account.getType().equals(accountType)).toBe(true);
    });

    it('should throw error for empty name', () => {
      expect(() =>
        Account.create(
          userId,
          '',
          'account-description',
          0 as Money,
          'USD',
          accountType,
        ),
      ).toThrowError('Account name cannot be empty');
    });

    it('should throw error for wrong account type', () => {
      expect(() =>
        Account.create(
          userId,
          'account-name',
          'account-description',
          0 as Money,
          'USD',
          AccountType.create('invalid-type'),
        ),
      ).toThrowError('Invalid account type');
    });
  });

  describe('restore', () => {
    it('should restore operation from database data', () => {
      const accountIdValue = '223e4567-e89b-12d3-a456-426614174000';
      const createdAtValue = '2023-10-01T12:00:00.000Z';
      const updatedAtValue = '2023-10-02T12:00:00.000Z';

      const accountId = Id.restore(accountIdValue);
      const createdAt = IsoDatetimeString.restore(createdAtValue);
      const updatedAt = IsoDatetimeString.restore(updatedAtValue);

      const account = Account.fromPersistence({
        createdAt: createdAt.valueOf(),
        currency: 'EUR',
        currentClearedBalanceLocal: 500 as Money,
        description: 'restored-description',
        id: accountId.valueOf(),
        initialBalance: 500 as Money,
        isArchived: false,
        isTombstone: false,
        name: 'restored-account',
        type: userTypeValue,
        updatedAt: updatedAt.valueOf(),
        userId: userIdValue,
      });

      expect(account).toBeInstanceOf(Account);
      expect(account.id?.toString()).toBe(accountIdValue);
      expect(account.userId.toString()).toBe(userIdValue);
      expect(account).toHaveProperty('name', 'restored-account');
      expect(account).toHaveProperty('description', 'restored-description');
      expect(account).toHaveProperty('initialBalance', 500);
      expect(account).toHaveProperty('currency', 'EUR');
    });
  });

  describe('account management', () => {
    it('should update account with valid value', () => {
      const account = Account.create(
        userId,
        'initial-name',
        'description',
        0 as Money,
        'USD',
        accountType,
      );

      account.updateAccount({ name: 'updated-name' });

      expect(account).toHaveProperty('name', 'updated-name');
      expect(account.getName()).toBe('updated-name');
    });

    describe('softDelete method', () => {
      it('should mark account as tombstone', () => {
        const account = Account.create(
          userId,
          'account-name',
          'account-description',
          0 as Money,
          'USD',
          accountType,
        );

        expect(account.isArchived()).toBe(false);

        account.markAsArchived();

        expect(account.isArchived()).toBe(true);
      });

      it('should not allow updates after soft deletion', () => {
        const account = Account.create(
          userId,
          'account-name',
          'account-description',
          0 as Money,
          'USD',
          accountType,
        );

        account.markAsArchived();

        expect(() => account.updateAccount({ name: 'new-name' })).toThrowError(
          'Cannot update a deleted entity',
        );
      });

      it('should not update account during soft deletion', () => {
        const account = Account.create(
          userId,
          'account-name',
          'account-description',
          0 as Money,
          'USD',
          accountType,
        );

        expect(account.isArchived()).toBe(false);

        const accountBeforeDeleting = account.toPersistence();

        account.markAsArchived();

        expect(account.isArchived()).toBe(true);

        const accountAfterDeleting = account.toPersistence();

        expect(accountBeforeDeleting).toEqual({
          ...accountAfterDeleting,
          isTombstone: false,
        });

        // expect(() => account.updateAccount({ name: 'new-name' })).toThrowError(
        //   'Cannot update a deleted entity',
        // );
      });
    });
  });
});
