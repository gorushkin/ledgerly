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

import { OpenCommodityUseCase } from '../openCommodity';

describe('OpenCommodityUseCase', () => {
  let user: User;

  const commodityRepository = {
    getById: vi.fn(),
    open: vi.fn(),
  };

  const mockTransactionManager = {
    run: vi.fn(),
  };
  const runTransaction: TransactionManagerInterface['run'] = async (callback) =>
    callback();

  const openCommodityUseCase = new OpenCommodityUseCase(
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
    commodityRepository.open.mockClear();
    commodityRepository.getById.mockClear();
    mockTransactionManager.run.mockClear();
  });

  describe('execute', () => {
    it('should open a commodity successfully', async () => {
      vi.useFakeTimers();

      const updatedAt = Timestamp.restore('2025-01-01T00:00:01.000Z').valueOf();
      const commodity = createCommodity(user, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });
      commodity.close();
      const commodityId = commodity.getId().valueOf();

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());
      commodityRepository.open.mockResolvedValue(undefined);

      vi.setSystemTime(new Date(updatedAt));

      const result = await openCommodityUseCase.execute(user, commodityId);

      expect(commodityRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
      );
      expect(commodityRepository.open).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
        { updatedAt },
      );
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        CommodityMapper.toResponseDTOFromSnapshot({
          ...commodity.toSnapshot(),
          isClosed: false,
          updatedAt,
        }),
      );
    });

    it('should not call open when commodity is already open', async () => {
      const commodity = createCommodity(user, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });
      const commodityId = commodity.getId().valueOf();

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());

      const result = await openCommodityUseCase.execute(user, commodityId);

      expect(commodityRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
      );
      expect(commodityRepository.open).not.toHaveBeenCalled();
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual(
        CommodityMapper.toResponseDTOFromSnapshot(commodity.toSnapshot()),
      );
    });

    it('should throw an error if the commodity does not exist', async () => {
      const nonExistentCommodityId = Id.create().valueOf();

      commodityRepository.getById.mockResolvedValue(null);

      await expect(
        openCommodityUseCase.execute(user, nonExistentCommodityId),
      ).rejects.toThrowError(
        new EntityNotFoundError({
          entityId: nonExistentCommodityId,
          entityType: Commodity.entityType,
        }),
      );
      expect(commodityRepository.open).not.toHaveBeenCalled();
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

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());

      await expect(
        openCommodityUseCase.execute(user, commodityId),
      ).rejects.toThrowError(
        new UnauthorizedAccessError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );
      expect(commodityRepository.open).not.toHaveBeenCalled();
    });
  });
});
