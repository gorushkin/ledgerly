import { createUser } from 'src/db/createTestUser';
import { AccountType, Commodity } from 'src/domain/';
import {
  Amount,
  Name,
  Id,
  Timestamp,
  CommodityCode,
} from 'src/domain/domain-core/';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { User } from '../users/user.entity';

import { Account } from './account.entity';

const userTypeValue = 'asset';

const name = Name.create('account-name');

describe('Account Domain Entity', () => {
  const accountType = AccountType.create(userTypeValue);

  let user: User;
  let commodity: Commodity;
  let userId: ReturnType<typeof Id.restore>;

  beforeAll(async () => {
    user = await createUser();
    commodity = Commodity.create(
      user,
      Name.create('commodity-name'),
      CommodityCode.create('COM'),
      2,
      'C',
    );
    userId = user.getId();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create method', () => {
    it('should create account with valid data', () => {
      const account = Account.create(
        user,
        commodity,
        name,
        'account-description',
        Amount.create('0'),
        accountType,
      );

      expect(account).toBeInstanceOf(Account);
      expect(account.getId()).toBeDefined();
      expect(account.belongsToUser(userId)).toBe(true);
      expect(account).toHaveProperty('name', name);
      expect(account).toHaveProperty('description', 'account-description');
      expect(account).toHaveProperty('initialBalance', Amount.create('0'));
      expect(account.getType().valueOf()).toBe(accountType.valueOf());
      expect(account.belongsToUser(userId)).toBe(true);
      expect(account.getType().equals(accountType)).toBe(true);
      expect(account.isCommoditySame(commodity)).toBe(true);
      expect(account).toHaveProperty(
        'commodityRelation',
        expect.objectContaining({ parentId: commodity.getId() }),
      );
    });
  });

  describe('restore', () => {
    it('should restore account from snapshot', () => {
      const accountIdValue = '223e4567-e89b-12d3-a456-426614174000';
      const createdAtValue = '2023-10-01T12:00:00.000Z';
      const updatedAtValue = '2023-10-02T12:00:00.000Z';

      const accountId = Id.restore(accountIdValue);
      const createdAt = Timestamp.restore(createdAtValue);
      const updatedAt = Timestamp.restore(updatedAtValue);

      const account = Account.restore({
        commodityId: commodity.getId().valueOf(),
        createdAt: createdAt.valueOf(),
        currentClearedBalanceLocal: Amount.create('500').valueOf(),
        description: 'restored-description',
        id: accountId.valueOf(),
        initialBalance: Amount.create('500').valueOf(),
        isSystem: false,
        isTombstone: false,
        name: 'restored-account',
        type: userTypeValue,
        updatedAt: updatedAt.valueOf(),
        userId: userId.valueOf(),
      });

      expect(account).toBeInstanceOf(Account);
      expect(account.getId().toString()).toBe(accountIdValue);
      expect(account.belongsToUser(userId)).toBe(true);
      expect(account).toHaveProperty('name', Name.create('restored-account'));
      expect(account).toHaveProperty('description', 'restored-description');
      expect(account).toHaveProperty('initialBalance', Amount.create('500'));
      expect(account).toHaveProperty(
        'commodityRelation',
        expect.objectContaining({ parentId: commodity.getId() }),
      );
    });
  });

  describe('account management', () => {
    it('should update account with valid value', () => {
      const account = Account.create(
        user,
        commodity,
        Name.create('initial-name'),
        'description',
        Amount.create('0'),
        accountType,
      );

      account.update({ name: 'updated-name' });

      expect(account).toHaveProperty('name', Name.create('updated-name'));
    });
  });

  describe('softDelete method', () => {
    it('should mark account as tombstone', () => {
      const account = Account.create(
        user,
        commodity,
        name,
        'account-description',
        Amount.create('0'),
        accountType,
      );

      expect(account.isDeleted()).toBe(false);

      account.markAsDeleted();

      expect(account.isDeleted()).toBe(true);
    });

    it('should not allow updates after soft deletion', () => {
      const account = Account.create(
        user,
        commodity,
        name,
        'account-description',
        Amount.create('0'),
        accountType,
      );

      account.markAsDeleted();

      expect(() => account.update({ name: 'new-name' })).toThrowError(
        'Cannot update a deleted entity',
      );
    });

    it('should not allow deleting an already deleted account', () => {
      const account = Account.create(
        user,
        commodity,
        name,
        'account-description',
        Amount.create('0'),
        accountType,
      );

      account.markAsDeleted();

      const deletedSnapshot = account.toSnapshot();

      let thrownError: unknown;

      try {
        account.markAsDeleted();
      } catch (error) {
        thrownError = error;
      }

      expect(thrownError).toMatchObject({
        code: 'DELETED_ENTITY_OPERATION',
        context: {
          entityType: Account.entityType,
          operation: 'delete',
        },
      });
      expect(account.toSnapshot()).toEqual(deletedSnapshot);
    });

    it('should only mark account as deleted and update timestamp during soft deletion', () => {
      vi.useFakeTimers();

      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const account = Account.create(
        user,
        commodity,
        name,
        'account-description',
        Amount.create('0'),
        accountType,
      );

      expect(account.isDeleted()).toBe(false);

      const accountBeforeDeleting = account.toSnapshot();

      vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));

      account.markAsDeleted();

      expect(account.isDeleted()).toBe(true);

      const accountAfterDeleting = account.toSnapshot();

      expect(accountAfterDeleting).toEqual({
        ...accountBeforeDeleting,
        isTombstone: true,
        updatedAt: accountAfterDeleting.updatedAt,
      });
      expect(accountAfterDeleting.updatedAt).not.toBe(
        accountBeforeDeleting.updatedAt,
      );
    });
  });

  it.todo('add test to cover isSystem property');
});
