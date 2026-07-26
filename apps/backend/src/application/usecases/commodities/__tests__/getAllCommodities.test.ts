import { CommodityRepositoryInterface } from 'src/application';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing/helpers';
import { describe, vi, beforeAll, beforeEach, expect, it } from 'vitest';

import { GetAllCommoditiesUseCase } from '../getAllCommodities';

describe('GetAllCommoditiesUseCase', () => {
  let user: User;

  const commodityRepository = {
    getAll: vi.fn(),
  };

  const getAllCommoditiesUseCase = new GetAllCommoditiesUseCase(
    commodityRepository as unknown as CommodityRepositoryInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    commodityRepository.getAll.mockClear();
  });

  describe('execute', () => {
    it('should return an array of commodities for the user', async () => {
      // Arrange
      const mockCommodities = [
        {
          code: 'USD',
          createdAt: new Date(),
          id: '1',
          isTombstone: false,
          name: 'US Dollar',
          precision: 2,
          symbol: '$',
          updatedAt: new Date(),
          userId: user.getId().valueOf(),
        },
        {
          code: 'EUR',
          createdAt: new Date(),
          id: '2',
          isTombstone: false,
          name: 'Euro',
          precision: 2,
          symbol: '€',
          updatedAt: new Date(),
          userId: user.getId().valueOf(),
        },
      ];

      commodityRepository.getAll.mockResolvedValue(mockCommodities);

      // Act
      const result = await getAllCommoditiesUseCase.execute(user);

      // Assert
      expect(commodityRepository.getAll).toHaveBeenCalledWith(
        user.getId().valueOf(),
      );
      expect(result).toEqual(
        mockCommodities.map((commodity) => ({
          code: commodity.code,
          createdAt: commodity.createdAt,
          id: commodity.id,
          isTombstone: commodity.isTombstone,
          name: commodity.name,
          precision: commodity.precision,
          symbol: commodity.symbol,
          updatedAt: commodity.updatedAt,
          userId: commodity.userId,
        })),
      );
    });
  });
});
