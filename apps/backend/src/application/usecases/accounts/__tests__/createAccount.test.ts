import type {
  TransactionManagerInterface,
  AccountRepositoryInterface,
} from 'src/application';
import { CommodityReferencePolicy } from 'src/application/services';
import { createUser } from 'src/db/createTestUser';
import { Commodity } from 'src/domain';
import { Amount, CommodityCode } from 'src/domain/domain-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CreateAccountUseCase } from '../createAccount';

describe('CreateAccountUseCase', async () => {
  const user = await createUser();

  let createAccountUseCase: CreateAccountUseCase;

  const accountRepository = {
    create: vi.fn(),
  };

  const commodityReferencePolicy = {
    assertUsableForNewAccount: vi.fn(),
  };

  const transactionManager = {
    run: vi.fn((cb: () => unknown) => cb()),
  };

  const name = 'Test Account';
  const description = 'Test account description';
  const initialBalance = Amount.create('1000').valueOf();
  const currentClearedBalanceLocal = Amount.create('0').valueOf();

  const commodity = Commodity.create(user, {
    code: CommodityCode.create('USD').valueOf(),
    name: 'Test Commodity',
    precision: 2,
    symbol: null,
  });
  const type = 'asset';

  beforeEach(() => {
    accountRepository.create.mockReset();
    commodityReferencePolicy.assertUsableForNewAccount.mockReset();

    createAccountUseCase = new CreateAccountUseCase(
      accountRepository as unknown as AccountRepositoryInterface,
      transactionManager as unknown as TransactionManagerInterface,
      commodityReferencePolicy as unknown as CommodityReferencePolicy,
    );
  });

  describe('execute', () => {
    it('should create a new account successfully', async () => {
      // Arrange

      const mockedCommoditySnapshot = commodity.toSnapshot();

      // Act
      const result = await createAccountUseCase.execute(user, {
        commodityId: mockedCommoditySnapshot.id,
        description,
        initialBalance,
        name,
        type,
      });

      expect(
        commodityReferencePolicy.assertUsableForNewAccount,
      ).toHaveBeenCalledWith(
        user.getId().valueOf(),
        mockedCommoditySnapshot.id,
      );

      expect(accountRepository.create).toHaveBeenCalledWith(
        user.getId().valueOf(),
        {
          commodityId: result.commodityId,
          createdAt: result.createdAt,
          currentClearedBalanceLocal,
          description,
          id: result.id,
          initialBalance,
          isClosed: false,
          isSystem: false,
          isTombstone: false,
          name,
          type,
          updatedAt: result.updatedAt,
          userId: result.userId,
        },
      );

      expect(result).toMatchObject({
        description,
        initialBalance,
        isSystem: false,
        name,
        type,
        userId: user.getId().valueOf(),
      });
    });

    it('should not create an account when commodity reference policy rejects', async () => {
      const error = new Error('closed commodity');
      const mockedCommoditySnapshot = commodity.toSnapshot();

      commodityReferencePolicy.assertUsableForNewAccount.mockRejectedValueOnce(
        error,
      );

      await expect(
        createAccountUseCase.execute(user, {
          commodityId: mockedCommoditySnapshot.id,
          description,
          initialBalance,
          name,
          type,
        }),
      ).rejects.toBe(error);

      expect(accountRepository.create).not.toHaveBeenCalled();
    });
  });
});
