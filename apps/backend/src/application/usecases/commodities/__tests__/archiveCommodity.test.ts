import { CommodityRepositoryInterface, CommodityMapper } from 'src/application';
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

import { ArchiveCommodityUseCase } from '../archiveCommodity';

describe('ArchiveCommodityUseCase', () => {
  let user: User;

  const commodityRepository = {
    getById: vi.fn(),
    softDelete: vi.fn(),
  };

  const archiveCommodityUseCase = new ArchiveCommodityUseCase(
    commodityRepository as unknown as CommodityRepositoryInterface,
    ensureOwnedSnapshot,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    vi.useRealTimers();
    commodityRepository.softDelete.mockClear();
    commodityRepository.getById.mockClear();
  });

  describe('execute', () => {
    it('should archive a commodity successfully', async () => {
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

      const archivedCommodityData = {
        ...commodity.toSnapshot(),
        isTombstone: true,
        timestamps: {
          createdAt: commodity.getCreatedAt().valueOf(),
          updatedAt: Timestamp.restore(timestampDuringUpdatingValue).valueOf(),
        },
      };

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());
      commodityRepository.softDelete.mockResolvedValue(archivedCommodityData);

      vi.setSystemTime(new Date(timestampDuringUpdatingValue));

      const expectedResult = CommodityMapper.toResponseDTOFromSnapshot(
        archivedCommodityData,
      );

      // Act
      const result = await archiveCommodityUseCase.execute(user, commodityId);

      // Assert
      expect(commodityRepository.getById).toHaveBeenCalledWith(
        userid,
        commodityId,
      );

      expect(commodityRepository.softDelete).toHaveBeenCalledWith(
        userid,
        commodityId,
        { updatedAt: archivedCommodityData.timestamps.updatedAt },
      );

      expect(result).toMatchObject(expectedResult);
    });

    it('should throw an error if the commodity does not exist', async () => {
      // Arrange
      const nonExistentCommodityId = Id.create().valueOf();

      commodityRepository.getById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        archiveCommodityUseCase.execute(user, nonExistentCommodityId),
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

      commodityRepository.getById.mockResolvedValue(commodity.toSnapshot());

      // Act & Assert
      await expect(
        archiveCommodityUseCase.execute(user, commodityId),
      ).rejects.toThrowError(
        new UnauthorizedAccessError({
          entityId: commodityId,
          entityType: Commodity.entityType,
        }),
      );
    });
  });
});
