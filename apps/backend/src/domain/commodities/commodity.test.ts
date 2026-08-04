import { compareEntities } from 'src/db/test-utils';
import { createUser } from 'src/testing';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CommodityCode, Id, Name, Timestamp } from '../domain-core';
import {
  DeletedEntityOperationError,
  InvalidCommodityPrecisionError,
  InvalidCommoditySymbolError,
} from '../domain.errors';
import { User } from '../users/user.entity';

import { Commodity } from './commodity.entity';
import { CommoditySnapshot, CreateCommodityProps } from './types';

describe('Commodity Domain Entity', () => {
  let user: User;
  let userId: ReturnType<typeof Id.restore>;

  const commodityCode = CommodityCode.create('commodityCode');
  const commoditySymbol = 'CMD';
  const commodityName = Name.create('Commodity Name');
  const commodityPrecision = 2;

  const commodityCreateProps: CreateCommodityProps = {
    code: commodityCode.valueOf(),
    name: commodityName.valueOf(),
    precision: commodityPrecision,
    symbol: commoditySymbol,
  };

  beforeAll(async () => {
    user = await createUser();
    userId = user.getId();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('create method', () => {
    it('should create commodity with valid data', () => {
      const commodity = Commodity.create(user, commodityCreateProps);

      expect(commodity).toBeInstanceOf(Commodity);
      expect(commodity.getId()).toBeDefined();
      expect(commodity.getUserId().valueOf()).toBe(userId.valueOf());
      expect(commodity).toHaveProperty('code', commodityCode);
      expect(commodity).toHaveProperty('symbol', commoditySymbol);
      expect(commodity.getUserId().equals(userId)).toBe(true);
    });

    it('should create commodity with default precision and null symbol', () => {
      const commodity = Commodity.create(user, {
        code: commodityCode.valueOf(),
        name: commodityName.valueOf(),
      });

      expect(commodity).toBeInstanceOf(Commodity);
      expect(commodity.getId()).toBeDefined();
      expect(commodity.getUserId().valueOf()).toBe(userId.valueOf());
      expect(commodity).toHaveProperty('code', commodityCode);
      expect(commodity).toHaveProperty('symbol', null);
      expect(commodity.getUserId().equals(userId)).toBe(true);
    });

    it('should create commodity with specified precision and null symbol', () => {
      const specifiedPrecision = 4;
      const commodity = Commodity.create(user, {
        code: commodityCode.valueOf(),
        name: commodityName.valueOf(),
        precision: specifiedPrecision,
      });

      expect(commodity).toBeInstanceOf(Commodity);
      expect(commodity.getId()).toBeDefined();
      expect(commodity.getUserId().valueOf()).toBe(userId.valueOf());
      expect(commodity).toHaveProperty('code', commodityCode);
      expect(commodity).toHaveProperty('symbol', null);
      expect(commodity.getUserId().equals(userId)).toBe(true);
    });

    it('should throw error when creating commodity with invalid precision', () => {
      const invalidPrecision = -1;

      expect(() => {
        Commodity.create(user, {
          ...commodityCreateProps,
          precision: invalidPrecision,
        });
      }).toThrowError(InvalidCommodityPrecisionError);
    });

    it('should throw error when creating commodity with invalid symbol', () => {
      const invalidSymbol = 'INVALID_SYMBOL';

      expect(() => {
        Commodity.create(user, {
          ...commodityCreateProps,
          symbol: invalidSymbol,
        });
      }).toThrowError(InvalidCommoditySymbolError);
    });
  });

  describe('restore method', () => {
    it('should restore commodity from snapshot', () => {
      const createdAtValue = '2023-10-01T12:00:00.000Z';
      const updatedAtValue = '2023-10-02T12:00:00.000Z';
      const commodityIdValue = '223e4567-e89b-12d3-a456-426614174000';

      const createdAt = Timestamp.restore(createdAtValue);
      const updatedAt = Timestamp.restore(updatedAtValue);

      const commodityId = Id.restore(commodityIdValue);

      const snapshot: CommoditySnapshot = {
        code: commodityCode.valueOf(),
        createdAt: createdAt.valueOf(),
        id: commodityId.valueOf(),
        isClosed: false,
        isTombstone: false,
        name: commodityName.valueOf(),
        precision: commodityPrecision,
        symbol: 'RCMD',
        updatedAt: updatedAt.valueOf(),
        userId: userId.valueOf(),
      };

      const restoredCommodity = Commodity.restore(snapshot);

      expect(restoredCommodity).toBeInstanceOf(Commodity);
      expect(restoredCommodity.getId().valueOf()).toBe(snapshot.id);
      expect(restoredCommodity.getUserId().valueOf()).toBe(snapshot.userId);
      expect(restoredCommodity).toHaveProperty(
        'code',
        CommodityCode.create(snapshot.code),
      );

      expect(restoredCommodity.symbol).toBe(snapshot.symbol);
      expect(restoredCommodity.belongsToUser(userId)).toBe(true);
    });

    it('should throw error when restoring commodity with invalid precision', () => {
      const snapshot: CommoditySnapshot = {
        code: commodityCode.valueOf(),
        createdAt: Timestamp.create().valueOf(),
        id: Id.create().valueOf(),
        isClosed: false,
        isTombstone: false,
        name: commodityName.valueOf(),
        precision: -1, // Invalid precision
        symbol: 'RCMD',
        updatedAt: Timestamp.create().valueOf(),
        userId: userId.valueOf(),
      };

      expect(() => {
        Commodity.restore(snapshot);
      }).toThrowError(InvalidCommodityPrecisionError);
    });

    it('should throw error when restoring commodity with invalid symbol', () => {
      const snapshot: CommoditySnapshot = {
        code: commodityCode.valueOf(),
        createdAt: Timestamp.create().valueOf(),
        id: Id.create().valueOf(),
        isClosed: false,
        isTombstone: false,
        name: commodityName.valueOf(),
        precision: commodityPrecision,
        symbol: 'INVALID_SYMBOL', // Invalid symbol
        updatedAt: Timestamp.create().valueOf(),
        userId: userId.valueOf(),
      };

      expect(() => {
        Commodity.restore(snapshot);
      }).toThrowError(InvalidCommoditySymbolError);
    });
  });

  describe('commodity management', () => {
    describe('markAsDeleted and isDeleted methods', () => {
      it('should mark commodity as deleted and check deletion status', () => {
        const commodity = Commodity.create(user, commodityCreateProps);

        expect(commodity.isDeleted()).toBe(false);

        commodity.delete();

        expect(commodity.isDeleted()).toBe(true);
      });

      it('should not allow updates on a deleted commodity', () => {
        const commodity = Commodity.create(user, commodityCreateProps);

        commodity.delete();

        const newCode = CommodityCode.create('updatedCode');

        expect(() => {
          commodity.update({ code: newCode.valueOf(), symbol: 'NEW' });
        }).toThrow(DeletedEntityOperationError);
      });

      it('should allow multiple delete calls without throwing error', () => {
        const commodity = Commodity.create(user, commodityCreateProps);

        expect(commodity.isDeleted()).toBe(false);

        const firstDeleteResult = commodity.delete();
        const secondDeleteResult = commodity.delete();

        expect(firstDeleteResult).toBe('changed');
        expect(secondDeleteResult).toBe('unchanged');
        expect(commodity.isDeleted()).toBe(true);

        compareEntities(commodity.toSnapshot(), {
          ...commodity.toSnapshot(),
          isTombstone: true,
        });
      });

      it('should only mark commodity as deleted and update timestamp during soft deletion', () => {
        vi.useFakeTimers();

        const timestampBeforeDeletionValue = '2025-01-01T00:00:00.000Z';
        const timestampDuringDeletionValue = '2025-01-01T00:00:01.000Z';

        vi.setSystemTime(new Date(timestampBeforeDeletionValue));

        const commodity = Commodity.create(user, commodityCreateProps);

        const commoditySnapshotBeforeDeletion = commodity.toSnapshot();

        expect(commodity.isDeleted()).toBe(false);

        vi.setSystemTime(new Date(timestampDuringDeletionValue));

        commodity.delete();

        const commoditySnapshotAfterDeletion = commodity.toSnapshot();

        expect(commodity.isDeleted()).toBe(true);

        expect(commoditySnapshotAfterDeletion).toEqual({
          ...commoditySnapshotBeforeDeletion,
          isTombstone: true,
          updatedAt: commoditySnapshotAfterDeletion.updatedAt,
        });

        expect(commoditySnapshotAfterDeletion.updatedAt).not.toBe(
          commoditySnapshotBeforeDeletion.updatedAt,
        );
      });
    });

    describe('close and open methods', () => {
      it('should close and touch the commodity', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

        const commodity = Commodity.create(user, commodityCreateProps);

        const before = commodity.toSnapshot();

        vi.setSystemTime(new Date('2025-01-01T00:00:01.000Z'));

        const closeResult = commodity.close();

        const afterClose = commodity.toSnapshot();

        expect(closeResult).toBe('changed');
        expect(afterClose.isClosed).toBe(true);
        expect(afterClose.updatedAt).not.toBe(before.updatedAt);
      });

      it('should open and touch the commodity', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

        const commodity = Commodity.create(user, commodityCreateProps);

        commodity.close();

        const before = commodity.toSnapshot();

        vi.setSystemTime(new Date('2025-01-01T00:00:01.000Z'));

        const openResult = commodity.open();

        const afterOpen = commodity.toSnapshot();

        expect(openResult).toBe('changed');
        expect(afterOpen.isClosed).toBe(false);
        expect(afterOpen.updatedAt).not.toBe(before.updatedAt);
      });

      it('should not update timestamp for unchanged close operation', () => {
        const commodity = Commodity.create(user, commodityCreateProps);

        commodity.close();

        const before = commodity.toSnapshot();

        const closeResult = commodity.close();

        const afterClose = commodity.toSnapshot();

        expect(closeResult).toBe('unchanged');
        expect(afterClose.isClosed).toBe(true);
        expect(afterClose.updatedAt).toBe(before.updatedAt);
      });

      it('should not update timestamp for unchanged open operation', () => {
        const commodity = Commodity.create(user, commodityCreateProps);

        const before = commodity.toSnapshot();

        const openResult = commodity.open();

        const afterOpen = commodity.toSnapshot();

        expect(openResult).toBe('unchanged');
        expect(afterOpen.isClosed).toBe(false);
        expect(afterOpen.updatedAt).toBe(before.updatedAt);
      });
    });

    describe('update method', () => {
      it('should update commodity name, code, and symbol and touch the timestamp', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));

        const commodity = Commodity.create(user, commodityCreateProps);

        const before = commodity.toSnapshot();

        const newName = Name.create('Updated Commodity Name');
        const newCode = CommodityCode.create('updatedCode');
        const newSymbol = 'UCMD';

        vi.setSystemTime(new Date('2025-01-01T00:00:01.000Z'));

        commodity.update({
          code: newCode.valueOf(),
          name: newName.valueOf(),
          symbol: newSymbol,
        });

        const updatedSnapshot = commodity.toSnapshot();

        expect(updatedSnapshot.name).toBe(newName.valueOf());
        expect(updatedSnapshot.symbol).toBe(newSymbol);
        expect(updatedSnapshot.code).toBe(newCode.valueOf());
        expect(updatedSnapshot.updatedAt).not.toBe(before.updatedAt);
      });
    });

    it('should throw error when updating commodity with invalid symbol', () => {
      const commodity = Commodity.create(user, commodityCreateProps);

      expect(() => {
        commodity.update({
          symbol: 'INVALID_SYMBOL',
        });
      }).toThrowError();
    });

    it('should not update timestamp for empty update', () => {
      const commodity = Commodity.create(user, commodityCreateProps);
      const snapshot = commodity.toSnapshot();

      commodity.update({});

      expect(commodity.toSnapshot()).toEqual(snapshot);
    });
  });
});
