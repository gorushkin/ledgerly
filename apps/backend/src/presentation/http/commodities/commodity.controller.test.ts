import { CommodityQuery } from '@ledgerly/shared/validation';
import {
  CloseCommodityUseCase,
  DeleteCommodityUseCase,
  CreateCommodityUseCase,
  GetAllCommoditiesUseCase,
  GetCommodityByIdUseCase,
  OpenCommodityUseCase,
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

  const mockDeleteCommodityUseCase = {
    execute: vi.fn(),
  };

  const mockCloseCommodityUseCase = {
    execute: vi.fn(),
  };

  const mockOpenCommodityUseCase = {
    execute: vi.fn(),
  };

  const commodityController = new CommodityController(
    mockGetCommodityByIdUseCase as unknown as GetCommodityByIdUseCase,
    mockGetAllCommoditiesUseCase as unknown as GetAllCommoditiesUseCase,
    mockCreateCommodityUseCase as unknown as CreateCommodityUseCase,
    mockUpdateCommodityUseCase as unknown as UpdateCommodityUseCase,
    mockDeleteCommodityUseCase as unknown as DeleteCommodityUseCase,
    mockCloseCommodityUseCase as unknown as CloseCommodityUseCase,
    mockOpenCommodityUseCase as unknown as OpenCommodityUseCase,
  );

  beforeEach(async () => {
    user = await createUser();

    vi.clearAllMocks();
  });

  describe('getAll', () => {
    const validQueryParams: {
      query: CommodityQuery;
      queryParams: unknown;
    }[] = [
      { query: { status: 'open' }, queryParams: { status: 'open' } },
      { query: { status: 'closed' }, queryParams: { status: 'closed' } },
      { query: { status: 'all' }, queryParams: { status: 'all' } },
      { query: { status: 'open' }, queryParams: {} },
    ];

    it.each(validQueryParams)(
      'should call getAllCommoditiesUseCase.execute with $query.status status',
      async ({ query, queryParams }) => {
        await commodityController.getAll(user, queryParams);

        expect(mockGetAllCommoditiesUseCase.execute).toHaveBeenCalledWith(
          user,
          query,
        );
        expect(mockGetAllCommoditiesUseCase.execute).toHaveBeenCalledTimes(1);
      },
    );

    const invalidQueryParams = [
      { status: 'deleted' },
      { status: '' },
      { status: null },
      { status: 1 },
      { status: true },
      'active',
      'archived',
      'deleted',
      '',
      undefined,
      null,
      1,
      true,
    ];

    it.each(invalidQueryParams)(
      'should throw ZodError if queryParams is invalid: %s',
      async (queryParams) => {
        await expect(
          commodityController.getAll(user, queryParams),
        ).rejects.toThrow(ZodError);

        expect(mockGetAllCommoditiesUseCase.execute).not.toHaveBeenCalled();
      },
    );
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

  describe('deleteCommodity', () => {
    it('should call deleteCommodityUseCase.execute with correct user and id', async () => {
      const requestParams = { id: commodityId };

      await commodityController.delete(user, requestParams);

      expect(mockDeleteCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
      );

      expect(mockDeleteCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestParams is invalid', async () => {
      const invalidRequestParams = { invalidId: 'commodity-id' };

      await expect(
        commodityController.delete(user, invalidRequestParams),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('closeCommodity', () => {
    it('should call closeCommodityUseCase.execute with correct user and id', async () => {
      const requestParams = { id: commodityId };

      await commodityController.close(user, requestParams);

      expect(mockCloseCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
      );

      expect(mockCloseCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestParams is invalid', async () => {
      const invalidRequestParams = { invalidId: 'commodity-id' };

      await expect(
        commodityController.close(user, invalidRequestParams),
      ).rejects.toThrow(ZodError);
    });
  });

  describe('openCommodity', () => {
    it('should call openCommodityUseCase.execute with correct user and id', async () => {
      const requestParams = { id: commodityId };

      await commodityController.open(user, requestParams);

      expect(mockOpenCommodityUseCase.execute).toHaveBeenCalledWith(
        user,
        requestParams.id,
      );

      expect(mockOpenCommodityUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it('should throw ZodError if requestParams is invalid', async () => {
      const invalidRequestParams = { invalidId: 'commodity-id' };

      await expect(
        commodityController.open(user, invalidRequestParams),
      ).rejects.toThrow(ZodError);
    });
  });
});
