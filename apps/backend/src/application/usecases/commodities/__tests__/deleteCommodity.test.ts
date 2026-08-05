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

import { DeleteCommodityUseCase } from '../deleteCommodity';

describe('DeleteCommodityUseCase', () => {
  let user: User;

  const commodityRepository = {
    delete: vi.fn(),
    getByIdForLifecycle: vi.fn(),
  };

  const mockTransactionManager = {
    run: vi.fn(),
  };
  const runTransaction: TransactionManagerInterface['run'] = async (callback) =>
    callback();

  const deleteCommodityUseCase = new DeleteCommodityUseCase(
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
    commodityRepository.delete.mockClear();
    commodityRepository.getByIdForLifecycle.mockClear();
    mockTransactionManager.run.mockClear();
  });

  describe('execute', () => {
    it('should delete a commodity successfully', async () => {
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

      const updatedAt = Timestamp.restore(
        timestampDuringUpdatingValue,
      ).valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(
        commodity.toSnapshot(),
      );
      commodityRepository.delete.mockResolvedValue(undefined);

      vi.setSystemTime(new Date(timestampDuringUpdatingValue));

      // Act
      const result = await deleteCommodityUseCase.execute(user, commodityId);

      // Assert
      expect(commodityRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        userid,
        commodityId,
      );

      expect(commodityRepository.delete).toHaveBeenCalledWith(
        userid,
        commodityId,
        { updatedAt },
      );

      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should not call delete when commodity is already deleted', async () => {
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

      const result = await deleteCommodityUseCase.execute(user, commodityId);

      expect(commodityRepository.getByIdForLifecycle).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
      );
      expect(commodityRepository.delete).not.toHaveBeenCalled();
      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should throw an error if the commodity does not exist', async () => {
      // Arrange
      const nonExistentCommodityId = Id.create().valueOf();

      commodityRepository.getByIdForLifecycle.mockResolvedValue(null);

      // Act & Assert
      await expect(
        deleteCommodityUseCase.execute(user, nonExistentCommodityId),
      ).rejects.toThrowError(
        new EntityNotFoundError({
          entityId: nonExistentCommodityId,
          entityType: Commodity.entityType,
        }),
      );
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

      commodityRepository.getByIdForLifecycle.mockResolvedValue(
        commodity.toSnapshot(),
      );

      // Act & Assert
      await expect(
        deleteCommodityUseCase.execute(user, commodityId),
      ).rejects.toThrowError(
        new UnauthorizedAccessError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );
    });
  });
});
