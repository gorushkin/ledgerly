import { CommodityResponseDTO } from '@ledgerly/shared/types';
import {
  CommodityRepositoryInterface,
  TransactionManagerInterface,
} from 'src/application';
import {
  EntityNotFoundError,
  UnauthorizedAccessError,
} from 'src/application/application.errors';
import { ensureOwnedSnapshot } from 'src/application/shared/ensureOwnedSnapshot';
import { createCommodity } from 'src/db/createTestUser';
import { Commodity } from 'src/domain/commodities/commodity.entity';
import { Id, Timestamp } from 'src/domain/domain-core/';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing/helpers';
import { describe, vi, beforeAll, beforeEach, expect, it } from 'vitest';

import { UpdateCommodityUseCase } from '../updateCommodity';

describe('UpdateCommodityUseCase', () => {
  let user: User;

  const commodityRepository = {
    getById: vi.fn(),
    update: vi.fn(),
  };

  const mockTransactionManager = {
    run: vi.fn(),
  };
  const runTransaction: TransactionManagerInterface['run'] = async (callback) =>
    callback();

  const updateCommodityUseCase = new UpdateCommodityUseCase(
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
    commodityRepository.update.mockClear();
    commodityRepository.getById.mockClear();
    mockTransactionManager.run.mockClear();
  });

  describe('execute', () => {
    it('should update a commodity successfully', async () => {
      vi.useFakeTimers();

      const timestampBeforeUpdatingValue = '2024-01-01T00:00:00.000Z';
      const timestampDuringUpdatingValue = '2025-01-01T00:00:01.000Z';

      vi.setSystemTime(new Date(timestampBeforeUpdatingValue));

      // Arrange
      const commodity = createCommodity(user, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });

      const commodityId = commodity.getId().valueOf();
      const userid = user.getId().valueOf();

      const updateData = {
        name: 'Updated Commodity',
        symbol: 'U',
      };

      const updatedCommodityData = {
        ...commodity.toSnapshot(),
        ...updateData,
        updatedAt: Timestamp.restore(timestampDuringUpdatingValue).valueOf(),
      };

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());

      commodityRepository.update.mockResolvedValue(undefined);

      vi.setSystemTime(new Date(timestampDuringUpdatingValue));

      const updatedCommoditySnapshot: CommodityResponseDTO = {
        ...updatedCommodityData,
        updatedAt: Timestamp.restore(timestampDuringUpdatingValue).valueOf(),
      };

      // Act
      const result = await updateCommodityUseCase.execute(
        user,
        commodityId,
        updateData,
      );

      // Assert
      expect(commodityRepository.getById).toHaveBeenCalledWith(
        userid,
        commodityId,
      );

      expect(commodityRepository.update).toHaveBeenCalledWith(
        userid,
        commodityId,
        {
          ...updatedCommodityData,
          updatedAt: Timestamp.restore(timestampDuringUpdatingValue).valueOf(),
        },
      );

      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedCommoditySnapshot);
    });

    it('should throw an error if the commodity does not exist', async () => {
      // Arrange
      const nonExistentCommodityId = Id.create().valueOf();

      commodityRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        updateCommodityUseCase.execute(user, nonExistentCommodityId, {
          name: 'Updated Commodity',
          symbol: 'U',
        }),
      ).rejects.toThrowError(
        new EntityNotFoundError({
          entityId: nonExistentCommodityId,
          entityType: Commodity.entityType,
        }),
      );
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

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());

      await expect(
        updateCommodityUseCase.execute(user, commodityId, {
          name: 'Updated Commodity',
          symbol: 'U',
        }),
      ).rejects.toThrowError(
        new EntityNotFoundError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );

      expect(commodityRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an error if the commodity does not belong to the user', async () => {
      // Arrange
      const otherUser = await createUser();
      const commodity = createCommodity(otherUser, {
        code: 'TEST',
        name: 'Test Commodity',
        precision: 2,
        symbol: 'T',
      });

      const commodityId = commodity.getId().valueOf();

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());

      // Act & Assert
      await expect(
        updateCommodityUseCase.execute(user, commodityId, {
          name: 'Updated Commodity',
          symbol: 'U',
        }),
      ).rejects.toThrowError(
        new UnauthorizedAccessError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );
    });
  });
});
