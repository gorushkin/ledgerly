import {
  ArchiveCommodityUseCase,
  CreateCommodityUseCase,
  GetAllCommoditiesUseCase,
  GetCommodityByIdUseCase,
  UpdateCommodityUseCase,
} from 'src/application/usecases/commodities';
import { CommodityCode } from 'src/domain/domain-core';
import { Id } from 'src/domain/domain-core/value-objects/Id';
import { User } from 'src/domain/users/user.entity';
import { createUser } from 'src/testing';
import { describe, vi, beforeEach, it, expect } from 'vitest';
import { ZodError } from 'zod';

import { CommodityController } from './commodity.controller';

describe('CommodityController', () => {
  let user: User;

  const commodityId = Id.restore(
    'b2035d76-f6b1-4546-8637-6f034f4ade50',
  ).valueOf();

  const mockGetCommodityByIdUseCase = {
    execute: vi.fn(),
  };

  const mockGetAllCommoditiesUseCase = {
    execute: vi.fn(),
  };

  const mockCreateCommodityUseCase = {
    execute: vi.fn(),
  };

  const mockUpdateCommodityUseCase = {
    execute: vi.fn(),
  };

  const mockArchiveCommodityUseCase = {
    execute: vi.fn(),
  };

  const commodityController = new CommodityController(
    mockGetCommodityByIdUseCase as unknown as GetCommodityByIdUseCase,
    mockGetAllCommoditiesUseCase as unknown as GetAllCommoditiesUseCase,
    mockCreateCommodityUseCase as unknown as CreateCommodityUseCase,
    mockUpdateCommodityUseCase as unknown as UpdateCommodityUseCase,
    mockArchiveCommodityUseCase as unknown as ArchiveCommodityUseCase,
  );

  beforeEach(async () => {
    user = await createUser();

    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should call getAllCommoditiesUseCase.execute with correct user', async () => {
      await commodityController.getAll(user);

      expect(mockGetAllCommoditiesUseCase.execute).toHaveBeenCalledWith(user);
      expect(mockGetAllCommoditiesUseCase.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('getById', () => {
    it('should call getCommodityByIdUseCase.execute with correct user and id', async () => {
      const requestParams = { id: commodityId };

      await commodityController.getById(user, requestParams);

      expect(mockGetCommodityByIdUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
      );
      expect(mockGetCommodityByIdUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestParams is invalid', async () => {
      const invalidRequestParams = { invalidId: 'commodity-id' };

      await expect(
        commodityController.getById(user, invalidRequestParams),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('create', () => {
    it('should call createCommodityUseCase.execute with correct user and data', async () => {
      const requestBody = {
        code: CommodityCode.create('CommodityCode').valueOf(),
        name: 'commodityName',
        precision: 2,
        symbol: null,
      };

      await commodityController.create(user, requestBody);

      expect(mockCreateCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestBody,
      );

      expect(mockCreateCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestBody is invalid', async () => {
      const invalidRequestBody = { invalidField: 'invalidValue' };

      await expect(
        commodityController.create(user, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });

    it('should allow to create commodity without precision', async () => {
      const requestBody = {
        code: CommodityCode.create('UpdatedCode').valueOf(),
        name: 'Updated Name',
      };

      await commodityController.create(user, requestBody);

      expect(mockCreateCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestBody,
      );
    });
  });

  describe('update', () => {
    const requestBody = {
      code: CommodityCode.create('UpdatedCode').valueOf(),
      name: 'Updated Name',
      symbol: '$',
    };

    it('should call updateCommodityUseCase.execute with correct user, id and data', async () => {
      const requestParams = { id: commodityId };

      await commodityController.update(user, requestParams, requestBody);

      expect(mockUpdateCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
        requestBody,
      );

      expect(mockUpdateCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestBody is invalid', async () => {
      const requestParams = { id: commodityId };
      const invalidRequestBody = { code: 'invalid-value' };

      await expect(
        commodityController.update(user, requestParams, invalidRequestBody),
      ).rejects.toThrow(ZodError);
    });

    it('should ignore precision in update', async () => {
      const requestParams = { id: commodityId };
      const requestBody = {
        code: 'USD',
        name: 'US Dollar',
        precision: 3,
        symbol: '$',
      };

      const expectedData = {
        code: requestBody.code,
        name: requestBody.name,
        symbol: requestBody.symbol,
      };

      await commodityController.update(user, requestParams, requestBody);

      expect(mockUpdateCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
        expectedData,
      );

      expect(mockUpdateCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestParams is invalid', async () => {
      const invalidRequestParams = { invalidId: 'commodity-id' };

      await expect(
        commodityController.update(user, invalidRequestParams, requestBody),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('archiveCommodity', () => {
    it('should call archiveCommodityUseCase.execute with correct user and id', async () => {
      const requestParams = { id: commodityId };

      await commodityController.archiveCommodity(user, requestParams);

      expect(mockArchiveCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
      );

      expect(mockArchiveCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestParams is invalid', async () => {
      const invalidRequestParams = { invalidId: 'commodity-id' };

      await expect(
        commodityController.archiveCommodity(user, invalidRequestParams),
      ).rejects.toThrow(ZodError);
    });
  });
});
