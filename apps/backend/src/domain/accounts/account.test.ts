import { AccountType } from 'src/domain/accounts/account-type.enum.ts';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { Timestamp } from 'src/domain/domain-core/value-objects/Timestamp';
import { describe, expect, it } from 'vitest';

import { Amount, Name } from '../domain-core';
import { Currency } from '../domain-core/value-objects/Currency';

import { Account } from './account.entity';

const userIdValue = Id.fromPersistence(
  '123e4567-e89b-12d3-a456-426614174000',
).valueOf();
const userTypeValue = 'asset';

const userId = Id.fromPersistence(userIdValue);

const currencyUSD = Currency.create('USD');
const currencyEUR = Currency.create('EUR');

const currencyCodeEUR = currencyEUR.valueOf();

const name = Name.create('account-name');

describe('Account Domain Entity', () => {
  const accountType = AccountType.create(userTypeValue);

  describe('create method', () => {
    it('should create account with valid data', () => {
      const account = Account.create(
        userId,
        name,
        'account-description',
        Amount.create('0'),
        currencyUSD,
        accountType,
      );

      expect(account).toBeInstanceOf(Account);
      expect(account.getId()).toBeDefined();
      expect(account.getUserId()).toBe(userId);
      expect(account).toHaveProperty('name', name);
      expect(account).toHaveProperty('description', 'account-description');
      expect(account).toHaveProperty('initialBalance', Amount.create('0'));
      expect(account).toHaveProperty('currency', currencyUSD);
      expect(account).toHaveProperty('type', { _value: 'asset' });
      expect(account.getUserId().isEqualTo(userId)).toBe(true);
      expect(account.belongsToUser(userId)).toBe(true);
      expect(account.getType().equals(accountType)).toBe(true);
    });

    it('should throw error for wrong account type', () => {
      expect(() =>
        Account.create(
          userId,
          name,
          'account-description',
          Amount.create('0'),
          currencyUSD,
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

      const accountId = Id.fromPersistence(accountIdValue);
      const createdAt = Timestamp.restore(createdAtValue);
      const updatedAt = Timestamp.restore(updatedAtValue);

      const account = Account.fromPersistence({
        createdAt: createdAt.valueOf(),
        currency: currencyCodeEUR,
        currentClearedBalanceLocal: Amount.create('500').valueOf(),
        description: 'restored-description',
        id: accountId.valueOf(),
        initialBalance: Amount.create('500').valueOf(),
        isTombstone: false,
        name: 'restored-account',
        type: userTypeValue,
        updatedAt: updatedAt.valueOf(),
        userId: userIdValue,
      });

      expect(account).toBeInstanceOf(Account);
      expect(account.getId().toString()).toBe(accountIdValue);
      expect(account.getUserId().toString()).toBe(userIdValue);
      expect(account).toHaveProperty('name', Name.create('restored-account'));
      expect(account).toHaveProperty('description', 'restored-description');
      expect(account).toHaveProperty('initialBalance', Amount.create('500'));
      expect(account).toHaveProperty('currency', currencyEUR);
    });
  });

  describe('account management', () => {
    it('should update account with valid value', () => {
      const account = Account.create(
        userId,
        Name.create('initial-name'),
        'description',
        Amount.create('0'),
        currencyUSD,
        accountType,
      );

      account.updateAccount({ name: 'updated-name' });

      expect(account).toHaveProperty('name', Name.create('updated-name'));
    });

    describe('softDelete method', () => {
      it('should mark account as tombstone', () => {
        const account = Account.create(
          userId,
          name,
          'account-description',
          Amount.create('0'),
          currencyUSD,
          accountType,
        );

        expect(account.isDeleted()).toBe(false);

        account.markAsDeleted();

        expect(account.isDeleted()).toBe(true);
      });

      it('should not allow updates after soft deletion', () => {
        const account = Account.create(
          userId,
          name,
          'account-description',
          Amount.create('0'),
          currencyUSD,
          accountType,
        );

        account.markAsDeleted();

        expect(() => account.updateAccount({ name: 'new-name' })).toThrowError(
          'Cannot update a deleted entity',
        );
      });

      it('should not update account during soft deletion', () => {
        const account = Account.create(
          userId,
          name,
          'account-description',
          Amount.create('0'),
          currencyUSD,
          accountType,
        );

        expect(account.isDeleted()).toBe(false);

        const accountBeforeDeleting = account.toPersistence();

        account.markAsDeleted();

        expect(account.isDeleted()).toBe(true);

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
