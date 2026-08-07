import { apiErrorCodes } from '@ledgerly/shared/types';
import {
  CommodityClosedError,
  CommodityHasActiveReferencesError,
} from 'src/application/application.errors';
import type {
  AccountRepositoryInterface,
  CommodityRepositoryInterface,
  TransactionRepositoryInterface,
} from 'src/application/interfaces';
import { CommodityReferencePolicy } from 'src/application/services/CommodityReferencePolicy';
import { createUser } from 'src/db/createTestUser';
import { Commodity } from 'src/domain/commodities';
import { CommodityCode, Id } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('CommodityReferencePolicy', async () => {
  const user = await createUser();
  const userId = user.getId().valueOf();
  const commodityId = Id.create().valueOf();

  const commodityRepository = {
    getById: vi.fn(),
  };
  const accountRepository = {
    existsActiveByCommodityId: vi.fn(),
  };
  const transactionRepository = {
    existsActiveByCommodityId: vi.fn(),
  };

  const policy = new CommodityReferencePolicy(
    commodityRepository as unknown as CommodityRepositoryInterface,
    accountRepository as unknown as AccountRepositoryInterface,
    transactionRepository as unknown as TransactionRepositoryInterface,
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
    accountRepository.existsActiveByCommodityId.mockResolvedValue(false);
    transactionRepository.existsActiveByCommodityId.mockResolvedValue(false);
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

  it('propagates repository lookup errors', async () => {
    const repositoryError = new Error('repository unavailable');

    commodityRepository.getById.mockRejectedValueOnce(repositoryError);

    await expect(
      policy.assertUsableForNewAccount(userId, commodityId),
    ).rejects.toBe(repositoryError);
  });

  it('allows deleting commodities without active references', async () => {
    await expect(
      policy.assertNoActiveReferences(userId, commodityId),
    ).resolves.toBeUndefined();

    expect(accountRepository.existsActiveByCommodityId).toHaveBeenCalledWith(
      userId,
      commodityId,
    );
    expect(
      transactionRepository.existsActiveByCommodityId,
    ).toHaveBeenCalledWith(userId, commodityId);
  });

  it('rejects deleting commodities with active account references', async () => {
    accountRepository.existsActiveByCommodityId.mockResolvedValueOnce(true);

    const assertion = policy.assertNoActiveReferences(userId, commodityId);

    await expect(assertion).rejects.toThrowError(
      CommodityHasActiveReferencesError,
    );
    await expect(assertion).rejects.toMatchObject({
      code: apiErrorCodes.commodityHasActiveReferences,
      context: { commodityId },
    });
    expect(
      transactionRepository.existsActiveByCommodityId,
    ).not.toHaveBeenCalled();
  });

  it('rejects deleting commodities with active transaction references', async () => {
    transactionRepository.existsActiveByCommodityId.mockResolvedValueOnce(true);

    const assertion = policy.assertNoActiveReferences(userId, commodityId);

    await expect(assertion).rejects.toThrowError(
      CommodityHasActiveReferencesError,
    );
    await expect(assertion).rejects.toMatchObject({
      code: apiErrorCodes.commodityHasActiveReferences,
      context: { commodityId },
    });
  });
});
