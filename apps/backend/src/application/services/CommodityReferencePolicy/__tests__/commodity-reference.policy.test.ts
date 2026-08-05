import { apiErrorCodes } from '@ledgerly/shared/types';
import { CommodityClosedError } from 'src/application/application.errors';
import type { CommodityRepositoryInterface } from 'src/application/interfaces';
import { CommodityReferencePolicy } from 'src/application/services/CommodityReferencePolicy';
import { createUser } from 'src/db/createTestUser';
import { Commodity } from 'src/domain/commodities';
import { CommodityCode, Id } from 'src/domain/domain-core';
import { DeletedEntityOperationError } from 'src/domain/domain.errors';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CommodityReferencePolicy', async () => {
  const user = await createUser();
  const userId = user.getId().valueOf();
  const commodityId = Id.create().valueOf();

  const commodityRepository = {
    getById: vi.fn(),
  };

  const policy = new CommodityReferencePolicy(
    commodityRepository as unknown as CommodityRepositoryInterface,
  );

  const createCommodity = () =>
    Commodity.create(user, {
      code: CommodityCode.create('USD').valueOf(),
      name: 'US Dollar',
      precision: 2,
      symbol: '$',
    });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows open commodities for new account references', async () => {
    const commodity = createCommodity();

    commodityRepository.getById.mockResolvedValueOnce({
      ...commodity.toSnapshot(),
      id: commodityId,
    });

    await expect(
      policy.assertUsableForNewAccount(userId, commodityId),
    ).resolves.toBeUndefined();

    expect(commodityRepository.getById).toHaveBeenCalledWith(
      userId,
      commodityId,
    );
  });

  it('rejects closed commodities for new account references', async () => {
    const commodity = createCommodity();
    commodity.close();

    commodityRepository.getById.mockResolvedValueOnce({
      ...commodity.toSnapshot(),
      id: commodityId,
    });

    const assertion = policy.assertUsableForNewAccount(userId, commodityId);

    await expect(assertion).rejects.toThrowError(CommodityClosedError);
    await expect(assertion).rejects.toMatchObject({
      code: apiErrorCodes.closedCommodityReference,
      context: {
        commodityId,
        operation: 'create_account',
      },
    });
  });

  it('rejects deleted commodities for new account references', async () => {
    const commodity = createCommodity();
    commodity.delete();

    commodityRepository.getById.mockResolvedValueOnce({
      ...commodity.toSnapshot(),
      id: commodityId,
    });

    const assertion = policy.assertUsableForNewAccount(userId, commodityId);

    await expect(assertion).rejects.toThrowError(DeletedEntityOperationError);
    await expect(assertion).rejects.toMatchObject({
      code: apiErrorCodes.deletedEntityOperation,
      context: {
        entityType: Commodity.entityType,
        operation: 'use',
      },
    });
  });

  it('propagates repository lookup errors', async () => {
    const repositoryError = new Error('repository unavailable');

    commodityRepository.getById.mockRejectedValueOnce(repositoryError);

    await expect(
      policy.assertUsableForNewAccount(userId, commodityId),
    ).rejects.toBe(repositoryError);
  });
});
