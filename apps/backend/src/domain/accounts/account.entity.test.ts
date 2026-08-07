import { createUser } from 'src/db/createTestUser';
import { compareEntities } from 'src/db/test-utils';
import {
  AccountType,
  Commodity,
  DeletedEntityOperationError,
} from 'src/domain/';
import { Name, Id, Timestamp, CommodityCode } from 'src/domain/domain-core/';
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
    commodity = Commodity.create(user, {
      code: CommodityCode.create('COM').valueOf(),
      name: 'commodity-name',
      precision: 2,
      symbol: 'C',
    });
    userId = user.getId();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create method', () => {
    it('should create account with valid data', () => {
      const description = 'account-description';

      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description,
        name,
        type: accountType,
      });

      expect(account).toBeInstanceOf(Account);
      expect(account.getId()).toBeDefined();
      expect(account.belongsToUser(userId)).toBe(true);
      expect(account).toHaveProperty('name', name);
      expect(account).toHaveProperty('description', description);
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
        description: 'restored-description',
        id: accountId.valueOf(),
        isClosed: false,
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
      expect(account).toHaveProperty(
        'commodityRelation',
        expect.objectContaining({ parentId: commodity.getId() }),
      );
    });
  });

  describe('account management', () => {
    it('should update account with valid value', () => {
      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description: 'description',
        name,
        type: accountType,
      });

      account.update({ name: 'updated-name' });

      expect(account).toHaveProperty('name', Name.create('updated-name'));
    });

    it('should not allow update after deletion', () => {
      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description: 'description',
        name,
        type: accountType,
      });

      account.delete();

      expect(() => account.update({ name: 'updated-name' })).toThrowError(
        DeletedEntityOperationError,
      );
    });
  });

  describe('softDelete method', () => {
    it('should mark account as tombstone', () => {
      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description: 'account-description',
        name,
        type: accountType,
      });

      expect(account.isDeleted()).toBe(false);

      account.delete();

      expect(account.isDeleted()).toBe(true);
    });

    it('should not allow updates after soft deletion', () => {
      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description: 'account-description',
        name,
        type: accountType,
      });

      account.delete();

      expect(() => account.update({ name: 'new-name' })).toThrowError(
        DeletedEntityOperationError,
      );
    });

    it('should allow multiple delete calls without throwing error', () => {
      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description: 'account-description',
        name,
        type: accountType,
      });

      expect(account.isDeleted()).toBe(false);

      const firstDeleteResult = account.delete();
      const secondDeleteResult = account.delete();

      expect(firstDeleteResult).toBe('changed');
      expect(secondDeleteResult).toBe('unchanged');
      expect(account.isDeleted()).toBe(true);

      compareEntities(account.toSnapshot(), {
        ...account.toSnapshot(),
        isTombstone: true,
      });
    });

    it('should only mark account as deleted and update timestamp during soft deletion', () => {
      vi.useFakeTimers();

      vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

      const account = Account.create(user, {
        commodityId: commodity.getId(),
        description: 'account-description',
        name,
        type: accountType,
      });

      expect(account.isDeleted()).toBe(false);

      const accountBeforeDeleting = account.toSnapshot();

      vi.setSystemTime(new Date('2026-01-01T00:00:01.000Z'));

      account.delete();

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

  it('should close and touch the account', () => {
    const account = Account.create(user, {
      commodityId: commodity.getId(),
      description: 'account-description',
      name,
      type: accountType,
    });

    const updatedAtBeforeClose = account.getUpdatedAt();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    account.close();

    expect(account.closed).toBe(true);
    expect(account.getUpdatedAt().toString()).not.toBe(
      updatedAtBeforeClose.toString(),
    );
  });

  it('should open and touch the account', () => {
    const account = Account.create(user, {
      commodityId: commodity.getId(),
      description: 'account-description',
      name,
      type: accountType,
    });

    account.close();

    const updatedAtBeforeOpen = account.getUpdatedAt();

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    account.open();

    expect(account.closed).toBe(false);
    expect(account.getUpdatedAt().toString()).not.toBe(
      updatedAtBeforeOpen.toString(),
    );
  });

  it('should not allow update isClosed and touch the account when it is deleted', () => {
    const account = Account.create(user, {
      commodityId: commodity.getId(),
      description: 'account-description',
      name,
      type: accountType,
    });

    account.delete();

    expect(() => account.close()).toThrowError(DeletedEntityOperationError);
  });
});
