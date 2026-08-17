import { CommodityCreateDTO, apiErrorCodes } from '@ledgerly/shared/types';
import { CommodityRepositoryInterface } from 'src/application';
import { createUser } from 'src/db/createTestUser';
import { User } from 'src/domain';
import { Name, CommodityCode } from 'src/domain/domain-core/';
import { RecordAlreadyExistsError } from 'src/infrastructure/errors';
import { beforeEach, describe, expect, it, vi, beforeAll } from 'vitest';

import { CreateCommodityUseCase } from '../createCommodity';

describe('CreateCommodityUseCase', () => {
  let user: User;
  let createCommodityUseCase: CreateCommodityUseCase;

  const commodityRepository = {
    create: vi.fn(),
  };

  beforeAll(async () => {
    user = await createUser();
  });

  beforeEach(() => {
    createCommodityUseCase = new CreateCommodityUseCase(
      commodityRepository as unknown as CommodityRepositoryInterface,
    );
  });

  describe('execute', () => {
    it('should create a new commodity successfully', async () => {
      // Arrange

      const data: CommodityCreateDTO = {
        code: CommodityCode.create('TEST').valueOf(),
        name: Name.create('Test Commodity').valueOf(),
        precision: 2,
        symbol: null,
      };

      // Act
      const result = await createCommodityUseCase.execute(user, data);

      // Assert
      expect(commodityRepository.create).toHaveBeenCalledWith(
        user.getId().valueOf(),
        {
          code: result.code,
          createdAt: result.createdAt,
          id: result.id,
          isClosed: false,
          isTombstone: false,
          name: result.name,
          precision: result.precision,
          symbol: result.symbol,
          updatedAt: result.updatedAt,
          userId: result.userId,
        },
      );

      expect(result).toMatchObject({
        code: data.code,
        isTombstone: false,
        name: data.name,
        precision: data.precision,
        symbol: data.symbol,
        userId: user.getId().valueOf(),
      });
    });

    it('should map duplicate commodity codes to ENTITY_ALREADY_EXISTS', async () => {
      const data: CommodityCreateDTO = {
        code: CommodityCode.create('TEST').valueOf(),
        name: Name.create('Test Commodity').valueOf(),
        precision: 2,
        symbol: null,
      };

      commodityRepository.create.mockRejectedValue(
        new RecordAlreadyExistsError({
          context: {
            field: 'code',
            tableName: 'commodities',
            value: data.code,
          },
        }),
      );

      await expect(
        createCommodityUseCase.execute(user, data),
      ).rejects.toMatchObject({
        code: apiErrorCodes.entityAlreadyExists,
        context: {
          entityType: 'commodity',
          field: 'code',
        },
      });
    });
  });
});
