import {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { CommodityMapper } from 'src/application/mappers';
import { ensureOwnedSnapshot } from 'src/application/shared/ensureOwnedSnapshot';
import { createCommodity } from 'src/db/createTestUser';
import { Commodity } from 'src/domain/commodities';
import { Id, Timestamp } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing/helpers';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { CloseCommodityUseCase } from '../closeCommodity';

describe('CloseCommodityUseCase', () => {
  let user: User;

  const commodityRepository = {
    close: vi.fn(),
    getByIdForLifecycle: vi.fn(),
  };

  const mockTransactionManager = {
    run: vi.fn(),
  };
  const runTransaction: TransactionManagerInterface['run'] = async (callback) =>
    callback();

  const closeCommodityUseCase = new CloseCommodityUseCase(
    commodityRepository as unknown as CommodityRepositoryInterface,
    ensureOwnedSnapshot,
    mockTransactionManager as unknown as TransactionManagerInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.useRealTimers();
    mockTransactionManager.run.mockImplementation(runTransaction);
    commodityRepository.close.mockClear();
    commodityRepository.getByIdForLifecycle.mockClear();
    mockTransactionManager.run.mockClear();
  });

  describe('execute', () => {
    it('should close a commodity successfully', async () => {
      vi.useFakeTimers();

      const updatedAt = Timestamp.restore('2025-01-01T00:00:01.000Z').valueOf();
      const commodity = createCommodity(user, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });
      const commodityId = commodity.getId().valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(
        commodity.toSnapshot(),
      );
      commodityRepository.close.mockResolvedValue(undefined);

      vi.setSystemTime(new Date(updatedAt));

      const result = await closeCommodityUseCase.execute(user, commodityId);

      expect(commodityRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
      );
      expect(commodityRepository.close).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
        { updatedAt },
      );
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        CommodityMapper.toResponseDTOFromSnapshot({
          ...commodity.toSnapshot(),
          isClosed: true,
          updatedAt,
        }),
      );
    });

    it('should not call close when commodity is already closed', async () => {
      const commodity = createCommodity(user, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });
      commodity.close();
      const commodityId = commodity.getId().valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(
        commodity.toSnapshot(),
      );

      const result = await closeCommodityUseCase.execute(user, commodityId);

      expect(commodityRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
      );
      expect(commodityRepository.close).not.toHaveBeenCalled();
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        CommodityMapper.toResponseDTOFromSnapshot(commodity.toSnapshot()),
      );
    });

    it('should throw an error if the commodity does not exist', async () => {
      const nonExistentCommodityId = Id.create().valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(null);

      await expect(
        closeCommodityUseCase.execute(user, nonExistentCommodityId),
      ).rejects.toThrowError(
        new EntityNotFoundError({
          entityId: nonExistentCommodityId,
          entityType: Commodity.entityType,
        }),
      );
      expect(commodityRepository.close).not.toHaveBeenCalled();
    });

    it('should throw an error if the commodity is deleted', async () => {
      const commodity = createCommodity(user, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });
      commodity.delete();
      const commodityId = commodity.getId().valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(
        commodity.toSnapshot(),
      );

      await expect(
        closeCommodityUseCase.execute(user, commodityId),
      ).rejects.toThrowError(
        new EntityNotFoundError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );
      expect(commodityRepository.close).not.toHaveBeenCalled();
    });

    it('should throw an error if the commodity does not belong to the user', async () => {
      const otherUser = await createUser();
      const commodity = createCommodity(otherUser, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });
      const commodityId = commodity.getId().valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(
        commodity.toSnapshot(),
      );

      await expect(
        closeCommodityUseCase.execute(user, commodityId),
      ).rejects.toThrowError(
        new UnauthorizedAccessError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );
      expect(commodityRepository.close).not.toHaveBeenCalled();
    });
  });
});
