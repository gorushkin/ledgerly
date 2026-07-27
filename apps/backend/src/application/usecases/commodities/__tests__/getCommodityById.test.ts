import { CommodityRepositoryInterface } from 'src/application';
import { Id } from 'src/domain/domain-core';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing/helpers';
import { describe, vi, beforeAll, beforeEach, expect, it } from 'vitest';

import { GetCommodityByIdUseCase } from '../getCommodityById';

describe('GetCommodityByIdUseCase', () => {
  let user: User;

  const commodityRepository = {
    getById: vi.fn(),
  };

  const getCommodityByIdUseCase = new GetCommodityByIdUseCase(
    commodityRepository as unknown as CommodityRepositoryInterface,
  );

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    commodityRepository.getById.mockClear();
  });

  describe('execute', () => {
    it('should return a commodity by its ID for the user', async () => {
      // Arrange
      const commodityId = Id.create().valueOf();

      const mockCommodity = {
        code: 'USD',
        createdAt: new Date(),
        id: commodityId,
        isTombstone: false,
        name: 'US Dollar',
        precision: 2,
        symbol: '$',
        updatedAt: new Date(),
        userId: user.getId().valueOf(),
      };

      commodityRepository.getById.mockResolvedValue(mockCommodity);

      // Act
      const result = await getCommodityByIdUseCase.execute(user, commodityId);

      // Assert
      expect(commodityRepository.getById).toHaveBeenCalledWith(
        user.getId().valueOf(),
        commodityId,
      );
      expect(result).toMatchObject({
        code: mockCommodity.code,
        isTombstone: mockCommodity.isTombstone,
        name: mockCommodity.name,
        precision: mockCommodity.precision,
        symbol: mockCommodity.symbol,
        userId: mockCommodity.userId,
      });
    });
  });
});
